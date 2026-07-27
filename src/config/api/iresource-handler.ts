import type { IHandler } from '@/config/api/ihandler';

type IResourceId = number | string;

interface IResourceHandler<
  IResourceResponse,
  IResourceRequest,
  IResourceUpdateRequest = IResourceRequest,
  IResourceDetailedResponse = IResourceResponse,
> extends IHandler {
  getAll(): Promise<IResourceResponse[]>;
  getById(resourceId: IResourceId): Promise<IResourceDetailedResponse>;
  create(payload: IResourceRequest): Promise<IResourceDetailedResponse>;
  update(
    resourceId: IResourceId,
    payload: IResourceUpdateRequest,
  ): Promise<IResourceDetailedResponse>;
  delete(resourceId: IResourceId): Promise<void>;
}

export type { IResourceHandler, IResourceId };
