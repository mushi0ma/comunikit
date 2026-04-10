import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { IdCardService } from './id-card.service.js';
import { SessionsService } from './sessions.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, IdCardService, SessionsService],
  exports: [AuthService],
})
export class AuthModule {}
