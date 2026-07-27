import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { Get } from '@/config/api/base-http-methods';
import { ResourceHandler } from '@/config/api/resource-handler';
import type {
  IComponent,
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

  public getCategories(): Promise<IComponent[]> {
    return Get<IComponent[]>({ endpoint: ApiEndpointPathnames.COMPONENTS_CATEGORIES });
  }
}

const COMPONENT_SERVICE = new ComponentService();

export { COMPONENT_SERVICE };
