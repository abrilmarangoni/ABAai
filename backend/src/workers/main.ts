import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for worker
  app.enableCors();
  
  await app.listen(4001);
  console.log('🚀 ABA Worker running on port 4001');
}

bootstrap();
