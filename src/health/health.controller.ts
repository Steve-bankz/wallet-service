import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator, // Injects the database health indicator
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check the health status of the application' })
  @ApiResponse({
    status: 200,
    description: 'The service is healthy and connected to its dependencies.',
  })
  @ApiResponse({
    status: 503,
    description: 'The service is unhealthy or cannot connect to a dependency.',
  })
  check() {
    return this.health.check([
      // The `check` method runs all health indicators in the array
      () => this.db.pingCheck('database'), // Checks if a connection to the DB can be established
    ]);
  }
}