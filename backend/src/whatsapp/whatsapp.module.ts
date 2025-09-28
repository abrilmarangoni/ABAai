import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-processing',
    }),
  ],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
