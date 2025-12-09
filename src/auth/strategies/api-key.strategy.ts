import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-header-strategy';
import { ApiKeyService } from '../../api-key/api-key.service'; // We will create this service method shortly

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super({ header: 'x-api-key', passReqToCallback: false },
    async (apiKey: string, done) => {
      const validationResult = await this.apiKeyService.validateApiKey(apiKey);
      if (!validationResult) {
        return done(new UnauthorizedException(), null);
      }
      return done(null, validationResult);
    });
  }
}