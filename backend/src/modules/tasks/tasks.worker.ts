import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { JobName, TASKS_QUEUE } from './tasks.constants.js';
import type { SampleJobPayload } from './tasks.producer.js';

interface HeartbeatPayload {
  startedAt: string;
}

/**
 * BullMQ worker for the comunikit-tasks queue. A single processor handles
 * all job names — branch on `job.name` to dispatch. Adding a new job type
 * means:
 *   1. declare a name in tasks.constants.ts
 *   2. add a producer method in tasks.producer.ts
 *   3. add a case in `process()` below
 */
@Processor(TASKS_QUEUE)
export class TasksWorker extends WorkerHost {
  private readonly logger = new Logger(TasksWorker.name);

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case JobName.HEARTBEAT:
        return this.handleHeartbeat(job as Job<HeartbeatPayload>);
      case JobName.SAMPLE_JOB:
        return this.handleSampleJob(job as Job<SampleJobPayload>);
      default:
        this.logger.warn(`Unhandled job name: ${job.name}`);
        return null;
    }
  }

  private handleHeartbeat(job: Job<HeartbeatPayload>) {
    this.logger.log(
      `[heartbeat] tick @ ${new Date().toISOString()} (started ${job.data.startedAt})`,
    );
    return { ok: true, tickedAt: new Date().toISOString() };
  }

  private async handleSampleJob(job: Job<SampleJobPayload>) {
    this.logger.log(
      `[sample-job] ${job.id} — "${job.data.message}" (enqueued ${job.data.enqueuedAt})`,
    );
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { ok: true, processedAt: new Date().toISOString() };
  }

  // ── Worker lifecycle events (useful for observability) ──────────

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.name}#${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(
      `Job ${job?.name ?? '?'}#${job?.id ?? '?'} failed: ${err.message}`,
      err.stack,
    );
  }
}
