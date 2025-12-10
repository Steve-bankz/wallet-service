import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google for authentication.' })
  async googleAuth(@Req() req) {
    // This guard initiates the Google OAuth2 flow
    // The user will be redirected to Google's sign-in page
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback URL' })
  @ApiResponse({ status: 200, description: 'Returns a JWT access token upon successful authentication.' })
  async googleAuthRedirect(@Req() req) {
    // After successful Google login, the user is redirected here.
    // The `req.user` object is populated by the GoogleStrategy's `validate` method.
    return this.authService.googleLogin(req.user);
  }
}