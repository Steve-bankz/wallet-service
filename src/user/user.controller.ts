import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt')) // This endpoint is for JWT-authenticated users only
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user profile and wallet details.',
    type: UserResponseDto, // This links the DTO to the Swagger docs for a clear schema
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@Req() req): UserResponseDto {
    // req.user is the full User entity with the wallet, attached by JwtStrategy
    return this.userService.getMe(req.user);
  }
}