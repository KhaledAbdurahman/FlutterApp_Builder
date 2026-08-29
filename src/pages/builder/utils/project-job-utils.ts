import { PROJECT_SERVICE } from '@/api/projects';
import type { IGenerationJob, IProjectId } from '@/types/api/project-types';

const DEFAULT_JOB_POLL_INTERVAL = 1_000;
const DEFAULT_JOB_MAX_ATTEMPTS = 1_800;

interface IWaitForProjectJobOptions {
  maxAttempts?: number;
  pollInterval?: number;
  shouldContinue?: () => boolean;
}

const wait = (delay: number): Promise<void> =>
  new Promise((resolve) => globalThis.setTimeout(resolve, delay));

const waitForProjectJob = async (
  projectId: IProjectId,
  initialJob: IGenerationJob,
  options: IWaitForProjectJobOptions = {},
): Promise<IGenerationJob> => {
  const {
    maxAttempts = DEFAULT_JOB_MAX_ATTEMPTS,
    pollInterval = DEFAULT_JOB_POLL_INTERVAL,
    shouldContinue = () => true,
  } = options;
  let job = initialJob;

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    if (job.status === 'completed') return job;

    if (job.status === 'failed') {
      throw new Error(job.error_message || `${job.job_type} job failed.`);
    }

    if (!shouldContinue()) {
      throw new Error(`${job.job_type} job polling was cancelled.`);
    }

    if (attempt === maxAttempts) break;

    await wait(pollInterval);
    job = await PROJECT_SERVICE.getGenerationJob(projectId, job.id);
  }

  throw new Error(`${job.job_type} job did not complete before the timeout.`);
};

export { waitForProjectJob };
