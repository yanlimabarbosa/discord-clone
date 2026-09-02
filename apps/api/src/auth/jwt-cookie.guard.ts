import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

export const SESSION_COOKIE = 'session';

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException('not authenticated');
    const user = await this.auth.userFromToken(token);
    if (!user) throw new UnauthorizedException('invalid session');
    (req as any).user = user;
    return true;
  }
}
