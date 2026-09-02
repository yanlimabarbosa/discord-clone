import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { LivekitService } from './livekit.service';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekit: LivekitService) {}

  @Get('token')
  async getToken(
    @Query('room') room: string,
    @Query('identity') identity: string,
  ) {
    if (!room || !identity) {
      throw new BadRequestException('room and identity are required');
    }
    const token = await this.livekit.createToken(room, identity);
    return { token };
  }
}
