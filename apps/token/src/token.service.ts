import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class TokenService {
  async createToken(room: string, identity: string): Promise<string> {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity },
    );
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
    return at.toJwt();
  }
}
