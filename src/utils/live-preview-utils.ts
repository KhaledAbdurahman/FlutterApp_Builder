import type { IProjectJsonData } from '@/types/api/project-types';

const LOCAL_PREVIEW_HOSTS = new Set(['127.0.0.1', 'localhost']);

const CreateLivePreviewProjectSignature = (
  projectName: string,
  projectJson: IProjectJsonData,
): string => JSON.stringify({ name: projectName, json_data: projectJson });

const CalculateLivePreviewScale = (
  availableWidth: number,
  availableHeight: number,
  deviceWidth: number,
  deviceHeight: number,
): number => {
  if (availableWidth <= 0 || availableHeight <= 0 || deviceWidth <= 0 || deviceHeight <= 0) {
    return 1;
  }

  return Math.min(1, availableWidth / deviceWidth, availableHeight / deviceHeight);
};

const ResolveLivePreviewUrl = (
  previewUrl: string,
  apiBaseUrl: string,
  browserOrigin: string,
): string => {
  try {
    const resolvedUrl = new URL(previewUrl, browserOrigin);
    const apiUrl = new URL(apiBaseUrl, browserOrigin);

    // The backend advertises localhost because Flutter binds locally; remote clients need its host.
    if (LOCAL_PREVIEW_HOSTS.has(resolvedUrl.hostname)) {
      resolvedUrl.hostname = apiUrl.hostname;
    }

    return resolvedUrl.toString();
  } catch {
    return previewUrl;
  }
};

export { CalculateLivePreviewScale, CreateLivePreviewProjectSignature, ResolveLivePreviewUrl };
