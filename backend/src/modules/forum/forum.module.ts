import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller.js';
import { ForumService } from './forum.service.js';

@Module({
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}
