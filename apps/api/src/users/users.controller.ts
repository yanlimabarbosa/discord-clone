import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { UsersService } from './users.service';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

@Controller('users')
@UseGuards(JwtCookieGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_AVATAR_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.users.setAvatar(user.id, file);
  }
}
