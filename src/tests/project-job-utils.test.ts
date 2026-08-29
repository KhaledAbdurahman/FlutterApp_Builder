import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGenerationJob, IGenerationJobStatus } from '@/types/api/project-types';

const { getGenerationJobMock } = vi.hoisted(() => ({
  getGenerationJobMock: vi.fn(),
}));

vi.mock('@/api/projects', () => ({
  PROJECT_SERVICE: {
    getGenerationJob: getGenerationJobMock,
  },
}));

import { waitForProjectJob } from '@/pages/builder/utils/project-job-utils';

const createJob = (status: IGenerationJobStatus, errorMessage = ''): IGenerationJob => ({
  id: 'job-id',
  job_type: 'generate',
  status,
  error_message: errorMessage,
  result: status === 'completed' ? { download_url: '/api/projects/project-id/download/' } : null,
  created_at: '2026-08-26T00:00:00Z',
  started_at: status === 'queued' ? null : '2026-08-26T00:00:01Z',
  completed_at: status === 'completed' || status === 'failed' ? '2026-08-26T00:00:02Z' : null,
});

describe('waitForProjectJob', () => {
  beforeEach(() => {
    getGenerationJobMock.mockReset();
  });

  it('returns completed jobs without another request', async () => {
    const completedJob = createJob('completed');

    await expect(waitForProjectJob('project-id', completedJob)).resolves.toBe(completedJob);
    expect(getGenerationJobMock).not.toHaveBeenCalled();
  });

  it('polls queued jobs until the backend marks them completed', async () => {
    const completedJob = createJob('completed');
    getGenerationJobMock
      .mockResolvedValueOnce(createJob('running'))
      .mockResolvedValueOnce(completedJob);

    await expect(
      waitForProjectJob('project-id', createJob('queued'), {
        maxAttempts: 2,
        pollInterval: 0,
      }),
    ).resolves.toBe(completedJob);
    expect(getGenerationJobMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces the backend failure reason', async () => {
    await expect(
      waitForProjectJob('project-id', createJob('failed', 'Generation failed.')),
    ).rejects.toThrow('Generation failed.');
  });
});
