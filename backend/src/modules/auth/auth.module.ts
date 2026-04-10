import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { IdCardService } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module.js';

@Module({
  imports: [TelegramBotModule],
  controllers: [AuthController],
  providers: [IdCardService, SessionsService],
})
export class AuthModule {}
