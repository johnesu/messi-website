import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ErrorCodes,
} from '../../common/errors/app-error';
import type { RegisterInput, LoginInput } from '@mesi/validation';
import type { AuthResponse, UserDto } from '@mesi/types';
import { ROLES } from '@mesi/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly audit: AuditService,
  ) {}

  async register(
    input: RegisterInput,
    req?: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError(ErrorCodes.EMAIL_EXISTS, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          roles: {
            create: [{ role: ROLES.CUSTOMER }],
          },
        },
      });
      await tx.customer.create({
        data: {
          userId: created.id,
          referralCode: this.generateReferralCode(created.firstName),
        },
      });
      return created;
    });

    const token = this.tokenService.generateEmailVerificationToken(user.id);
    await this.emailService.sendVerifyEmail(user, token);
    await this.emailService.sendWelcome(user);

    await this.audit.log(
      { actorId: user.id, action: 'auth.register', resource: 'user', resourceId: user.id },
      req,
    );

    return this.issueTokens(user);
  }

  async login(
    input: LoginInput,
    req?: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('ACCOUNT_DISABLED', 'This account has been disabled');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.emailVerified && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedError(
        ErrorCodes.EMAIL_NOT_VERIFIED,
        'Please verify your email before logging in',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log(
      { actorId: user.id, action: 'auth.login', resource: 'user', resourceId: user.id },
      req,
    );

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = this.tokenService.hash(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt) {
      throw new UnauthorizedError(
        ErrorCodes.INVALID_REFRESH_TOKEN,
        'Invalid or expired refresh token',
      );
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError('REFRESH_TOKEN_EXPIRED', 'Refresh token expired');
    }
    if (!stored.user.isActive) {
      throw new UnauthorizedError('ACCOUNT_DISABLED', 'Account is not active');
    }

    // Rotate: revoke current token; a fresh one is issued via issueTokens
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      actorId: userId,
      action: 'auth.logout',
      resource: 'user',
      resourceId: userId,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    let payload: { sub: string; type: string; purpose: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new BadRequestError('INVALID_VERIFY_TOKEN', 'Invalid or expired verification token');
    }
    if (payload.type !== 'email-verify' || payload.purpose !== 'verify') {
      throw new BadRequestError('INVALID_VERIFY_TOKEN', 'Invalid verification token');
    }
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal whether the account exists
      return;
    }
    const token = this.tokenService.generatePasswordResetToken(user.id);
    await this.emailService.sendPasswordReset(user, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { sub: string; type: string; purpose: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new BadRequestError(
        ErrorCodes.INVALID_RESET_TOKEN,
        'Invalid or expired reset token',
      );
    }
    if (payload.type !== 'password-reset' || payload.purpose !== 'reset') {
      throw new BadRequestError(ErrorCodes.INVALID_RESET_TOKEN, 'Invalid reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: payload.sub }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revokedAt: new Date() },
      });
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestError('INVALID_PASSWORD', 'Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    });
    await this.audit.log({ actorId: userId, action: 'auth.change_password', resource: 'user', resourceId: userId });
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    return this.toUserDto(user);
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerified: boolean;
  }): Promise<AuthResponse> {
    const accessToken = this.tokenService.signAccessToken(user);
    const refresh = this.tokenService.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.tokenHash,
        expiresAt: refresh.expiresAt,
      },
    });

    const roles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      select: { role: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        roles: roles.map((r) => r.role) as UserDto['roles'],
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      accessToken,
      refreshToken: refresh.raw,
    };
  }

  private toUserDto(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerified: boolean;
    createdAt: Date;
    roles: { role: string }[];
    isActive: boolean;
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,
      roles: user.roles.map((r) => r.role) as UserDto['roles'],
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
    };
  }

  private generateReferralCode(firstName: string): string {
    const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
    return `REF-${firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'MSI'}-${suffix}`;
  }
}
