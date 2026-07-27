import type { ApiEndpointPathnames } from '@/config/api/api-endpoints';

export abstract class IHandler {
  readonly endpoint: ApiEndpointPathnames;
  constructor(endpoint: ApiEndpointPathnames) {
    this.endpoint = endpoint;
  }
}
