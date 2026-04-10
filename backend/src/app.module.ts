import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { validateEnv } from './config/env.schema.js';
import { HealthModule } from './modules/health/health.module.js';
import { WhitelistModule } from './modules/whitelist/whitelist.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ListingsModule } from './modules/listings/listings.module.js';
import { ForumModule } from './modules/forum/forum.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module.js';
import { UploadModule } from './modules/upload/upload.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    WhitelistModule,
    AuthModule,
    ListingsModule,
    ForumModule,
    CommentsModule,
    NotificationsModule,
    UsersModule,
    TelegramBotModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
