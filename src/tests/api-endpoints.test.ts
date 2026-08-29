import { describe, expect, it } from 'vitest';
import {
  ApiEndpointPathnames,
  getEndpointPathname,
  getProjectJobEndpointPathname,
} from '@/config/api/api-endpoints';

describe('API endpoint path helpers', () => {
  it('encodes resource identifiers', () => {
    expect(getEndpointPathname(ApiEndpointPathnames.PROJECT, 'project/id')).toBe(
      'projects/project%2Fid/',
    );
  });

  it('resolves both identifiers in a project job path', () => {
    expect(getProjectJobEndpointPathname('project/id', 'job/id')).toBe(
      'projects/project%2Fid/jobs/job%2Fid/',
    );
  });
});
