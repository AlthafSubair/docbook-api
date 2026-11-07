import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('System')
@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({
    status: 200,
    description: 'Application is running healthy',
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Database connectivity and readiness check' })
  @ApiResponse({
    status: 200,
    description: 'PostgreSQL database connection is established and healthy',
  })
  async getDatabaseHealth() {
    return this.appService.getDatabaseHealth();
  }
}
