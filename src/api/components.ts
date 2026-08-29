import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { Get } from '@/config/api/base-http-methods';
import { ResourceHandler } from '@/config/api/resource-handler';
import type {
  IAvailableComponentsResponse,
  IComponent,
  IComponentCategoriesResponse,
  IComponentCreateRequest,
  IComponentType,
  IComponentUpdateRequest,
} from '@/types/api/component-types';

class ComponentService extends ResourceHandler<
  IComponent,
  IComponentCreateRequest,
  IComponentUpdateRequest
> {
  constructor() {
    super(ApiEndpointPathnames.COMPONENTS);
  }

  public getCategories(): Promise<IComponentCategoriesResponse> {
    return Get<IComponentCategoriesResponse>({
      endpoint: ApiEndpointPathnames.COMPONENTS_CATEGORIES,
    });
  }

  public getAvailable(): Promise<IAvailableComponentsResponse> {
    return Get<IAvailableComponentsResponse>({
      endpoint: ApiEndpointPathnames.COMPONENTS_AVAILABLE,
    });
  }
}

const COMPONENT_SERVICE = new ComponentService();

export { COMPONENT_SERVICE };
