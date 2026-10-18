import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {

  constructor(private readonly dataSource: DataSource) { }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    try {
      // Runs a lightweight ping query
      await this.dataSource.query('SELECT 1');
      return {
        database: 'connected',
        status: 'ok',
      };
    } catch (error) {
      // Returns a standard 503 Service Unavailable if the DB is down
      throw new ServiceUnavailableException({
        database: 'disconnected',
        status: 'error',
      });
    }
  }

}
