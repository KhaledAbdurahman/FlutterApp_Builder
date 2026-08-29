import type { Screen } from '@/types/screen-types';

type ILivePreviewResponseStatus = 'success' | 'error' | 'info';
type ILivePreviewServerStatus =
  'idle' | 'starting' | 'getting_dependencies' | 'compiling' | 'serving' | 'error' | 'stopped';

interface ILivePreviewStatusResponse {
  status: ILivePreviewResponseStatus;
  preview_status: ILivePreviewServerStatus;
  ready: boolean;
  message: string;
  preview_url: string | null;
  port: number | null;
  error: string | null;
  started_at: string | null;
  updated_at: string | null;
}

interface ILivePreviewActionResponse {
  status: ILivePreviewResponseStatus;
  message?: string;
}

interface ILivePreviewStopResponse extends ILivePreviewActionResponse {
  preview_status: ILivePreviewServerStatus;
  ready: boolean;
}

interface ILivePreviewUpdateRequest {
  screen: Screen;
}

interface IActiveLivePreview {
  port: number;
  project_path: string;
  preview_url: string;
  idle_seconds: number;
}

type IActiveLivePreviewMap = Record<string, IActiveLivePreview>;

interface IActiveLivePreviewsResponse {
  status: ILivePreviewResponseStatus;
  active_previews: IActiveLivePreviewMap;
}

export type {
  IActiveLivePreview,
  IActiveLivePreviewMap,
  IActiveLivePreviewsResponse,
  ILivePreviewActionResponse,
  ILivePreviewResponseStatus,
  ILivePreviewServerStatus,
  ILivePreviewStatusResponse,
  ILivePreviewStopResponse,
  ILivePreviewUpdateRequest,
};
