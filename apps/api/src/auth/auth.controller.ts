import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  type LoginInput,
} from '@i2s/contracts';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
  ) {
    return this.auth.login(body.email, body.password, clientContext(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string },
    @Req() req: Request,
  ) {
    return this.auth.refresh(body.refreshToken, clientContext(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Body() body: { refreshToken?: string },
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.auth.logout(body?.refreshToken, user.id);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
      clientContext(req),
    );
  }
}

function clientContext(req: Request) {
  return {
    ip: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}
