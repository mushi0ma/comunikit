import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TasksProducer } from './tasks.producer.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly producer: TasksProducer) {}

  /** POST /api/tasks/sample — enqueue a one-off sample job (for dev/testing). */
  @Post('sample')
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueueSample(@Body() body: { message?: string }) {
    const jobId = await this.producer.enqueueSampleJob({
      message: body.message ?? 'hello from tasks controller',
      enqueuedAt: new Date().toISOString(),
    });
    return { success: true, data: { jobId } };
  }
}
