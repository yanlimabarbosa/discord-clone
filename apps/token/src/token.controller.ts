import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  async getToken(
    @Query('room') room: string,
    @Query('identity') identity: string,
  ) {
    if (!room || !identity) {
      throw new BadRequestException('room and identity are required');
    }
    const token = await this.tokenService.createToken(room, identity);
    return { token };
  }
}
