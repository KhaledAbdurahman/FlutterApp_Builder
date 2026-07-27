import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { Post } from '@/config/api/base-http-methods';
import { IHandler } from '@/config/api/ihandler';
import type { IFlutterGenerationRequest } from '@/types/api/flutter-generation-types';

class FlutterGenerationService extends IHandler {
  constructor() {
    super(ApiEndpointPathnames.GENERATE_FLUTTER_APPLICATION);
  }

  public generateFlutterApplication(payload: IFlutterGenerationRequest): Promise<Blob> {
    return Post<Blob, IFlutterGenerationRequest>({
      endpoint: this.endpoint,
      payload,
      responseType: 'blob',
    });
  }
}

const FLUTTER_GENERATION_SERVICE = new FlutterGenerationService();

export { FLUTTER_GENERATION_SERVICE };
