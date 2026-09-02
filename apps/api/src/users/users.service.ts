import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, toPublicUser } from '../auth/public-user';

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
}
