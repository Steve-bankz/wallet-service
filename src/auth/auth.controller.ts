import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // This guard initiates the Google OAuth2 flow
    // The user will be redirected to Google's sign-in page
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    // After successful Google login, the user is redirected here.
    // The `req.user` object is populated by the GoogleStrategy's `validate` method.
    return this.authService.googleLogin(req.user);
  }
}