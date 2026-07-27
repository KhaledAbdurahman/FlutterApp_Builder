import { ApiEndpointPathnames, getEndpointPathname } from '@/config/api/api-endpoints';
import { Get, Post } from '@/config/api/base-http-methods';
import { ResourceHandler } from '@/config/api/resource-handler';
import type {
  IProject,
  IProjectAndroidApplicationPackageBuildResponse,
  IProjectCreateRequest,
  IProjectGenerationLog,
  IProjectGenerationResponse,
  IProjectId,
  IProjectUpdateRequest,
} from '@/types/api/project-types';

class ProjectService extends ResourceHandler<
  IProject,
  IProjectCreateRequest,
  IProjectUpdateRequest
> {
  constructor() {
    super(ApiEndpointPathnames.PROJECTS);
  }

  public generateFlutterApplication(projectId: IProjectId): Promise<IProjectGenerationResponse> {
    return Post<IProjectGenerationResponse>({
      endpoint: getEndpointPathname(
        ApiEndpointPathnames.PROJECT_GENERATE_FLUTTER_APPLICATION,
        projectId,
      ),
    });
  }

  public downloadFlutterApplication(projectId: IProjectId): Promise<Blob> {
    return Get<Blob>({
      endpoint: getEndpointPathname(
        ApiEndpointPathnames.PROJECT_DOWNLOAD_FLUTTER_APPLICATION,
        projectId,
      ),
      responseType: 'blob',
    });
  }

  public getGenerationLogs(projectId: IProjectId): Promise<IProjectGenerationLog[]> {
    return Get<IProjectGenerationLog[]>({
      endpoint: getEndpointPathname(ApiEndpointPathnames.PROJECT_GENERATION_LOGS, projectId),
    });
  }

  public buildAndroidApplicationPackage(
    projectId: IProjectId,
  ): Promise<IProjectAndroidApplicationPackageBuildResponse> {
    return Post<IProjectAndroidApplicationPackageBuildResponse>({
      endpoint: getEndpointPathname(
        ApiEndpointPathnames.PROJECT_BUILD_ANDROID_APPLICATION_PACKAGE,
        projectId,
      ),
    });
  }

  public downloadAndroidApplicationPackage(projectId: IProjectId): Promise<Blob> {
    return Get<Blob>({
      endpoint: getEndpointPathname(
        ApiEndpointPathnames.PROJECT_DOWNLOAD_ANDROID_APPLICATION_PACKAGE,
        projectId,
      ),
      responseType: 'blob',
    });
  }

  public startLivePreview(projectId: IProjectId): Promise<IProject> {
    return Post<IProject>({
      endpoint: getEndpointPathname(ApiEndpointPathnames.PROJECT_START_LIVE_PREVIEW, projectId),
    });
  }

  public stopLivePreview(projectId: IProjectId): Promise<IProject> {
    return Post<IProject>({
      endpoint: getEndpointPathname(ApiEndpointPathnames.PROJECT_STOP_LIVE_PREVIEW, projectId),
    });
  }

  public getActiveLivePreviews(): Promise<IProject[]> {
    return Get<IProject[]>({ endpoint: ApiEndpointPathnames.PROJECT_ACTIVE_LIVE_PREVIEWS });
  }
}

const PROJECT_SERVICE = new ProjectService();

export { PROJECT_SERVICE };
