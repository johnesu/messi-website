import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, ROLES_KEY, PERMISSIONS_KEY } from '../decorators/auth.decorator';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { AuthUser } from '../decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  type: string;
}

const rolePermissionsCache = new Map<string, string[]>();
let cacheTtlMs = 60_000;
let lastCacheLoad = 0;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    if (isPublic) {
      // Optionally attach user even for public routes if a valid token is present
      const token = this.extractToken(request);
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
          request.user = await this.buildUser(payload.sub);
        } catch {
          // ignore invalid token on public routes
        }
      }
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedError();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedError('INVALID_TOKEN', 'Invalid or expired token');
    }

    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedError();
    }

    const user = await this.buildUser(payload.sub);
    request.user = user;

    // Role check
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((r) => user.roles.includes(r));
      if (!hasRole) throw new ForbiddenError();
    }

    // Permission check
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredPerms && requiredPerms.length > 0) {
      const hasPerm = requiredPerms.every((p) => {
        if (user.roles.includes('SUPER_ADMIN')) return true;
        return user.permissions.includes(p);
      });
      if (!hasPerm) throw new ForbiddenError();
    }

    return true;
  }

  private extractToken(request: {
    headers: Record<string, string | undefined>;
  }): string | null {
    const header = request.headers?.authorization;
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }

  private async buildUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { roleRef: true } },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('ACCOUNT_DISABLED', 'Account is not active');
    }

    const roles = user.roles.map((r) => r.role);

    let permissions: string[] = [];
    if (roles.includes('SUPER_ADMIN')) {
      permissions = ['*'];
    } else {
      permissions = await this.loadPermissionsForRoles(roles);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
    };
  }

  private async loadPermissionsForRoles(roles: string[]): Promise<string[]> {
    if (Date.now() - lastCacheLoad > cacheTtlMs) {
      rolePermissionsCache.clear();
      lastCacheLoad = Date.now();
      const all = await this.prisma.rolePermission.findMany({
        include: { permission: true },
      });
      const map = new Map<string, string[]>();
      for (const rp of all) {
        const arr = map.get(rp.role) ?? [];
        arr.push(rp.permission.codename);
        map.set(rp.role, arr);
      }
      for (const [role, perms] of map) rolePermissionsCache.set(role, perms);
    }
    const perms = new Set<string>();
    for (const role of roles) {
      const rp = rolePermissionsCache.get(role) ?? [];
      for (const p of rp) perms.add(p);
    }
    return Array.from(perms);
  }
}
