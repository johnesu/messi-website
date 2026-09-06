import { Body, Controller, Get, HttpCode, Post, Req, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from '@mesi/validation';
import { z } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema, () => 'body'))
  register(@Body() body: z.infer<typeof registerSchema>, @Req() req: Request) {
    return this.authService.register(body, req as never);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(loginSchema, () => 'body'))
  login(@Body() body: z.infer<typeof loginSchema>, @Req() req: Request) {
    return this.authService.login(body, req as never);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema, () => 'body'))
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema, () => 'body'))
  logout(@CurrentUser('id') userId: string, @Body() body: { refreshToken: string }) {
    return this.authService.logout(userId, body.refreshToken);
  }

  @Public()
  @Post('verify-email')
  @UsePipes(new ZodValidationPipe(verifyEmailSchema, () => 'body'))
  verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema, () => 'body'))
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema, () => 'body'))
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('change-password')
  @UsePipes(new ZodValidationPipe(changePasswordSchema, () => 'body'))
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }
}
