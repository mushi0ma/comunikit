import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TASKS_QUEUE } from './tasks.constants.js';
import { TasksProducer } from './tasks.producer.js';
import { TasksWorker } from './tasks.worker.js';
import { TasksController } from './tasks.controller.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: config.get<number>('REDIS_PORT') ?? 6379,
        },
      }),
    }),
    BullModule.registerQueue({ name: TASKS_QUEUE }),
  ],
  controllers: [TasksController],
  providers: [TasksProducer, TasksWorker],
  exports: [TasksProducer],
})
export class TasksModule {}
