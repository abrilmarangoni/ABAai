import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'ABA AI WhatsApp Ordering Bot API is running! 🤖';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      version: '1.0.0',
      services: {
        database: 'connected', // TODO: Add actual health checks
        redis: 'connected',
        openai: 'connected',
        whatsapp: 'connected',
      },
    };
  }
}
