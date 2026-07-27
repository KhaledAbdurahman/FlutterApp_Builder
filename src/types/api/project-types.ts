type IProjectStatus = 'draft' | 'generating' | 'completed' | 'failed';
type IProjectId = number | string;

interface IProjectJsonData {
  app_name: string;
  package_name: string;
  screens: unknown[];
}

interface IProjectScreen {
  id: string;
  name: string;
  route: string;
  is_home?: boolean;
  json_data: unknown;
  order?: number;
  created_at: string;
  updated_at: string;
}

interface IProject {
  id: IProjectId;
  name: string;
  description?: string;
  json_data: IProjectJsonData;
  status: IProjectStatus;
  screens: IProjectScreen[];
  created_at: string;
  updated_at: string;
  generated_file: string | null;
  apk_file: string | null;
  preview_url: string | null;
  error_message?: string;
}

interface IProjectCreateRequest {
  name: string;
  description?: string;
  json_data: IProjectJsonData;
}

type IProjectUpdateRequest = Partial<IProjectCreateRequest>;

// These action responses are retained from the established backend integration because OpenAPI currently describes them as Project.
interface IProjectGenerationResponse {
  status: 'success' | 'error';
  message: string;
  download_url?: string;
}

interface IProjectAndroidApplicationPackageBuildResponse {
  status: 'success' | 'error' | 'building';
  message: string;
  build_id?: string;
  download_url?: string;
}

interface IProjectGenerationLog {
  step: string;
  status: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export type {
  IProject,
  IProjectAndroidApplicationPackageBuildResponse,
  IProjectCreateRequest,
  IProjectGenerationLog,
  IProjectGenerationResponse,
  IProjectId,
  IProjectJsonData,
  IProjectScreen,
  IProjectStatus,
  IProjectUpdateRequest,
};
