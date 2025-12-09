import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')!,
    });
  }

  // Passport first verifies the JWT's signature and expiration, then calls this method.
  async validate(payload: { sub: string; email: string }) {
    // Load user with wallet to ensure it's available
    const user = await this.userService.findByIdWithWallet(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  
}