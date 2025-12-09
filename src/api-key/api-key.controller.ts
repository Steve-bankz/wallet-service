import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { RevokeApiKeyDto } from './dto/revoke-api-key.dto';



@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt')) // Protect this endpoint with our JWT strategy
  create(
    @Req() req,
    @Body(new ValidationPipe()) createApiKeyDto: CreateApiKeyDto,
  ) {
    // The `req.user` object is attached by the JwtStrategy's `validate` method
    const userId = req.user.id;
    return this.apiKeyService.create(userId, createApiKeyDto);
  }

  @Post('rollover')
  @UseGuards(AuthGuard('jwt')) // Also protected by JWT
  rollover(
    @Req() req,
    @Body(new ValidationPipe()) rolloverDto: RolloverApiKeyDto,
  ) {
    const userId = req.user.id;
    return this.apiKeyService.rollover(userId, rolloverDto);
  }

  @Post('revoke')
  @UseGuards(AuthGuard('jwt'))
  revoke(@Req() req, @Body(new ValidationPipe()) revokeDto: RevokeApiKeyDto) {
    const userId = req.user.id;
    return this.apiKeyService.revoke(userId, revokeDto);
  }
}