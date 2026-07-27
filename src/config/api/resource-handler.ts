import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { Delete, Get, Patch, Post } from '@/config/api/base-http-methods';
import type { IResourceHandler, IResourceId } from '@/config/api/iresource-handler';

class ResourceHandler<
  IResourceResponse,
  IResourceRequest,
  IResourceUpdateRequest = IResourceRequest,
  IResourceDetailedResponse = IResourceResponse,
> implements IResourceHandler<
  IResourceResponse,
  IResourceRequest,
  IResourceUpdateRequest,
  IResourceDetailedResponse
> {
  public readonly endpoint: ApiEndpointPathnames;

  constructor(endpoint: ApiEndpointPathnames) {
    this.endpoint = endpoint;
  }

  public getAll(): Promise<IResourceResponse[]> {
    return Get<IResourceResponse[]>({ endpoint: this.endpoint });
  }

  public getById(resourceId: IResourceId): Promise<IResourceDetailedResponse> {
    return Get<IResourceDetailedResponse>({ endpoint: this.getResourceEndpoint(resourceId) });
  }

  public create(payload: IResourceRequest): Promise<IResourceDetailedResponse> {
    return Post<IResourceDetailedResponse, IResourceRequest>({
      endpoint: this.endpoint,
      payload,
    });
  }

  public update(
    resourceId: IResourceId,
    payload: IResourceUpdateRequest,
  ): Promise<IResourceDetailedResponse> {
    return Patch<IResourceDetailedResponse, IResourceUpdateRequest>({
      endpoint: this.getResourceEndpoint(resourceId),
      payload,
    });
  }

  public delete(resourceId: IResourceId): Promise<void> {
    return Delete({ endpoint: this.getResourceEndpoint(resourceId) });
  }

  private getResourceEndpoint(resourceId: IResourceId): string {
    return `${this.endpoint}${encodeURIComponent(String(resourceId))}/`;
  }
}

export { ResourceHandler };
