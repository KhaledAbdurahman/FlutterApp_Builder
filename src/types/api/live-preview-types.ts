import type { Screen } from '@/types/screen-types';

type ILivePreviewResponseStatus = 'success' | 'error' | 'info';

interface ILivePreviewStartResponse {
  status: ILivePreviewResponseStatus;
  message: string;
  preview_url: string;
  port: number;
}

interface ILivePreviewActionResponse {
  status: ILivePreviewResponseStatus;
  message?: string;
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
  ILivePreviewStartResponse,
  ILivePreviewUpdateRequest,
};
