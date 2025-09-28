import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MessageProcessor } from './message.processor';
import { AiModule } from '../ai/ai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-processing',
    }),
    AiModule,
    WhatsappModule,
    NotificationsModule,
  ],
  providers: [MessageProcessor],
})
export class WorkersModule {}
