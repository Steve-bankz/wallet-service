import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyModule } from '../api-key/api-key.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';

@Module({
  imports: [
    UserModule, // We need UserService
    PassportModule,
    forwardRef( () => ApiKeyModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' }, // Token expires in 1 day
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, ApiKeyStrategy],
  exports: [AuthService], 
})
export class AuthModule {}