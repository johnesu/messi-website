import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { paginate, buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: { page?: number; limit?: number; q?: string; role?: string }) {
    const { page, limit, skip, take } = paginate(query);
    const where: Record<string, unknown> = {};
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.roles = { some: { role: query.role } };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where: where as never }),
      this.prisma.user.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { roles: { include: { roleRef: true } } },
      }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { roleRef: true } } },
    });
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    return user;
  }

  async roles() {
    const roles = await this.prisma.roleName.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });
    return roles;
  }

  async setRoles(id: string, roles: string[], actorId: string, req?: unknown) {
    await this.findOne(id);
    const validRoles = await this.prisma.roleName.findMany({ select: { name: true } });
    const valid = new Set(validRoles.map((r) => r.name));
    for (const r of roles) {
      if (!valid.has(r)) throw new BadRequestError('INVALID_ROLE', `Role ${r} does not exist`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: roles.map((role) => ({ userId: id, role })),
      });
    });
    await this.audit.log(
      { actorId, action: 'user.roles_change', resource: 'user', resourceId: id, metadata: { roles } },
      req as never,
    );
    return this.findOne(id);
  }

  async setActive(id: string, isActive: boolean, actorId: string, req?: unknown) {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isActive } });
    await this.audit.log(
      { actorId, action: isActive ? 'user.activate' : 'user.deactivate', resource: 'user', resourceId: id },
      req as never,
    );
    return this.findOne(id);
  }
}
