/** Name of the single BullMQ queue used by comunikit's background workers. */
export const TASKS_QUEUE = 'comunikit-tasks';

/** Enum-like catalog of job names — add new entries here instead of stringly
 *  typing them at call sites. Keeps producers and workers in lockstep. */
export const JobName = {
  /** One-off sample job enqueued via POST /api/tasks/sample (admin-only). */
  SAMPLE_JOB: 'sample-job',
  /** Repeatable cron-scheduled heartbeat — proves the scheduler wiring. */
  HEARTBEAT: 'heartbeat',
} as const;

export type JobName = (typeof JobName)[keyof typeof JobName];
