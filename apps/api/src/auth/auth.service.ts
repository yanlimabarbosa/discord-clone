import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async createGuest(displayName: string): Promise<User> {
    return this.prisma.user.create({
      data: { displayName: displayName.trim(), isGuest: true },
    });
  }

  async register(
    username: string,
    password: string,
    displayName?: string,
  ): Promise<User> {
    const handle = username.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { username: handle },
    });
    if (existing) throw new ConflictException('username already taken');
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        username: handle,
        passwordHash,
        displayName: (displayName ?? username).trim(),
      },
    });
  }

  async login(username: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid credentials');
    return user;
  }

  signToken(user: User): string {
    return this.jwt.sign({ sub: user.id });
  }

  async userFromToken(token: string): Promise<User | null> {
    try {
      const { sub } = this.jwt.verify(token);
      return this.prisma.user.findUnique({ where: { id: sub } });
    } catch {
      return null;
    }
  }
}
