import { Module } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { MercadopagoController } from './mercadopago.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [MercadopagoService],
  controllers: [MercadopagoController],
  exports: [MercadopagoService],
})
export class MercadopagoModule {}
