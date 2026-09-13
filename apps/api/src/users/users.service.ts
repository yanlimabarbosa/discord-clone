import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, User } from '@prisma/client';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, toPublicUser } from '../auth/public-user';

const MAX_DISPLAY_NAME = 40;
const MAX_USERNAME = 32;
const MIN_PASSWORD = 6;

export type UpdateMeInput = {
  displayName?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async setAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<PublicUser> {
    if (!file) throw new BadRequestException('no file uploaded');

    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = extname(file.originalname) || '.png';
    const filename = `${userId}-${Date.now()}${ext}`;
    await fs.writeFile(join(uploadsDir, filename), file.buffer);

    const avatarUrl = '/api/uploads/' + filename;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return toPublicUser(user);
  }

  async updateMe(user: User, input: UpdateMeInput): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};

    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new BadRequestException('display name cannot be empty');
      }
      if (displayName.length > MAX_DISPLAY_NAME) {
        throw new BadRequestException(
          `display name must be at most ${MAX_DISPLAY_NAME} characters`,
        );
      }
      data.displayName = displayName;
    }

    if (input.username !== undefined) {
      if (user.isGuest) {
        throw new ForbiddenException('guests cannot change their username');
      }
      const username = input.username.trim().toLowerCase();
      if (!username) {
        throw new BadRequestException('username cannot be empty');
      }
      if (username.length > MAX_USERNAME) {
        throw new BadRequestException(
          `username must be at most ${MAX_USERNAME} characters`,
        );
      }
      if (username !== user.username) data.username = username;
    }

    if (input.newPassword !== undefined) {
      if (user.isGuest || !user.passwordHash) {
        throw new ForbiddenException('guests cannot change their password');
      }
      if (!input.currentPassword) {
        throw new BadRequestException('current password required');
      }
      const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!ok) {
        throw new BadRequestException('current password is incorrect');
      }
      if (input.newPassword.length < MIN_PASSWORD) {
        throw new BadRequestException(
          `password must be at least ${MIN_PASSWORD} characters`,
        );
      }
      data.passwordHash = await bcrypt.hash(input.newPassword, 10);
    }

    if (Object.keys(data).length === 0) return toPublicUser(user);

    try {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data,
      });
      return toPublicUser(updated);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('username already taken');
      }
      throw err;
    }
  }
}
