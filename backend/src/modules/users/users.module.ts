import { Module } from '@nestjs/common';
import { EnsureUserModule } from '../../common/ensure-user.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule, EnsureUserModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
