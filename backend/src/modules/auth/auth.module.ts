import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { IdCardService } from './id-card.service.js';

@Module({
  controllers: [AuthController],
  providers: [IdCardService],
})
export class AuthModule {}
