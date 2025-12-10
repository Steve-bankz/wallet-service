import { Module } from '@nestjs/common';
    import { TerminusModule } from '@nestjs/terminus';
    import { HttpModule } from '@nestjs/axios';
    import { HealthController } from './health.controller';

    @Module({
      imports: [
        TerminusModule, // The core module
        HttpModule,     // A dependency for some health indicators
      ],
      controllers: [HealthController],
    })
    export class HealthModule {}