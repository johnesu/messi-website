import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  type: 'refresh';
  jti: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(user: { id: string; email: string }): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return this.jwt.sign(payload);
  }

  generateRefreshToken(): {
    raw: string;
    jti: string;
    expiresAt: Date;
    tokenHash: string;
  } {
    const jti = randomBytes(24).toString('hex');
    const raw = randomBytes(48).toString('hex');
    const payload: RefreshTokenPayload = {
      sub: '',
      email: '',
      type: 'refresh',
      jti,
    };
    payload.sub = 'token';
    payload.email = 'token';
    const token = this.jwt.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      raw,
      jti,
      expiresAt,
      tokenHash: this.hash(raw),
    };
  }

  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.jwt.verify<AccessTokenPayload>(token);
    if (payload.type !== 'access') {
      throw new Error('Not an access token');
    }
    return payload;
  }

  generateEmailVerificationToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, type: 'email-verify', purpose: 'verify' },
      { expiresIn: '24h' },
    );
  }

  generatePasswordResetToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, type: 'password-reset', purpose: 'reset' },
      { expiresIn: '1h' },
    );
  }
}
