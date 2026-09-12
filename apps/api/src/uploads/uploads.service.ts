import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class UploadsService {
  async save(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('no file uploaded');
    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const ext = extname(file.originalname) || '.png';
    const filename = `att-${userId}-${Date.now()}-${Math.round(
      file.size,
    )}${ext}`;
    await fs.writeFile(join(uploadsDir, filename), file.buffer);
    return { url: `/api/uploads/${filename}`, type: file.mimetype };
  }
}
