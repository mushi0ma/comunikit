import { Module } from '@nestjs/common';
import { EnsureUserModule } from '../../common/ensure-user.module.js';
import { ForumController } from './forum.controller.js';
import { ForumService } from './forum.service.js';

@Module({
  imports: [EnsureUserModule],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}
