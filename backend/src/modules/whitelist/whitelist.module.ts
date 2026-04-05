import { Module } from '@nestjs/common';
import { WhitelistController } from './whitelist.controller.js';

@Module({
  controllers: [WhitelistController],
})
export class WhitelistModule {}
