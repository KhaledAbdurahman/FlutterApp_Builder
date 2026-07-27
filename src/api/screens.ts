import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { ResourceHandler } from '@/config/api/resource-handler';
import type { IScreen, IScreenCreateRequest, IScreenUpdateRequest } from '@/types/api/screen-types';

class ScreenService extends ResourceHandler<IScreen, IScreenCreateRequest, IScreenUpdateRequest> {
  constructor() {
    super(ApiEndpointPathnames.SCREENS);
  }
}

const SCREEN_SERVICE = new ScreenService();

export { SCREEN_SERVICE };
