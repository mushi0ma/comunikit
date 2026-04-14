import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EnsureUserService } from './ensure-user.service.js';

@Module({
  imports: [PrismaModule],
  providers: [EnsureUserService],
  exports: [EnsureUserService],
})
export class EnsureUserModule {}
