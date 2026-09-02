import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, CookieOptions } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtCookieGuard, SESSION_COOKIE } from './jwt-cookie.guard';
import { toPublicUser } from './public-user';

const isHttps = (process.env.PUBLIC_URL ?? '').startsWith('https');
const COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isHttps,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('guest')
  async guest(
    @Body('displayName') displayName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!displayName?.trim()) throw new BadRequestException('nickname required');
    const user = await this.auth.createGuest(displayName);
    return this.respondWithSession(user, res);
  }

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('displayName') displayName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!username?.trim() || !password) {
      throw new BadRequestException('username and password required');
    }
    if (password.length < 6) {
      throw new BadRequestException('password must be at least 6 characters');
    }
    const user = await this.auth.register(username, password, displayName);
    return this.respondWithSession(user, res);
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!username?.trim() || !password) {
      throw new BadRequestException('username and password required');
    }
    const user = await this.auth.login(username, password);
    return this.respondWithSession(user, res);
  }

  @Get('me')
  @UseGuards(JwtCookieGuard)
  me(@CurrentUser() user: User) {
    return toPublicUser(user);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { ...COOKIE_OPTS, maxAge: undefined });
    return { ok: true };
  }

  private respondWithSession(user: User, res: Response) {
    const token = this.auth.signToken(user);
    res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);
    return toPublicUser(user);
  }
}
