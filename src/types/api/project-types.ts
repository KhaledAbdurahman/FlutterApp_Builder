import type { Screen } from '@/types/screen-types';

type IProjectStatus = 'draft' | 'generating' | 'completed' | 'failed';
type IProjectId = number | string;
type IGenerationJobType = 'generate' | 'build_apk' | 'start_preview';
type IGenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed';

interface IProjectJsonData {
  app_name: string;
  package_name: string;
  // The editor and generator share this snapshot so a saved project cannot load one screen tree and generate another.
  screens: Screen[];
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
  // Kept for the planned standalone Screens API; the current editor reads json_data.screens.
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

interface IGenerationJobResult {
  download_url?: string;
  preview_url?: string;
  [key: string]: unknown;
}

interface IGenerationJob {
  id: string;
  job_type: IGenerationJobType;
  status: IGenerationJobStatus;
  error_message: string;
  result: IGenerationJobResult | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface IProjectGenerationLog {
  step: string;
  status: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

interface IProjectGenerationLogsResponse {
  logs: IProjectGenerationLog[];
}

export type {
  IGenerationJob,
  IGenerationJobResult,
  IGenerationJobStatus,
  IGenerationJobType,
  IProject,
  IProjectCreateRequest,
  IProjectGenerationLog,
  IProjectGenerationLogsResponse,
  IProjectId,
  IProjectJsonData,
  IProjectScreen,
  IProjectStatus,
  IProjectUpdateRequest,
};
