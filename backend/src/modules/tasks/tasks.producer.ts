import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { JobName, TASKS_QUEUE } from './tasks.constants.js';

export interface SampleJobPayload {
  message: string;
  enqueuedAt: string;
}

@Injectable()
export class TasksProducer implements OnModuleInit {
  private readonly logger = new Logger(TasksProducer.name);

  constructor(
    @InjectQueue(TASKS_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Register the repeatable "heartbeat" cron job on boot. BullMQ dedupes
   * repeatable jobs by (name, pattern, cron, every, endDate, tz) so calling
   * `add` on every restart is idempotent.
   */
  async onModuleInit(): Promise<void> {
    await this.queue.add(
      JobName.HEARTBEAT,
      { startedAt: new Date().toISOString() },
      {
        // Every minute — keep it short enough to verify wiring during dev,
        // in production bump it or replace with a real cron expression.
        repeat: { pattern: '*/1 * * * *' },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
        jobId: 'cron:heartbeat', // stable id so repeats don't pile up
      },
    );
    this.logger.log(
      `Registered repeatable "${JobName.HEARTBEAT}" job (every 1 min)`,
    );
  }

  /** Enqueue a one-off sample job. Returns the BullMQ job id. */
  async enqueueSampleJob(payload: SampleJobPayload): Promise<string> {
    const job = await this.queue.add(JobName.SAMPLE_JOB, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
    this.logger.log(
      `Enqueued ${JobName.SAMPLE_JOB} (jobId=${job.id}): ${payload.message}`,
    );
    return String(job.id);
  }
}
