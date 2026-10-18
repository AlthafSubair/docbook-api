import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller("system")
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get("health")
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ready')
  async getDatabaseHealth() {
    return this.appService.getDatabaseHealth();
  }

}
