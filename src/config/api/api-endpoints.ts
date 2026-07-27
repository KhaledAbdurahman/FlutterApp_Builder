enum ApiEndpointPathnames {
  AUTH_LOGIN = 'auth/login/',
  AUTH_LOGOUT = 'auth/logout/',
  AUTH_REGISTER = 'auth/register/',
  COMPONENTS = 'components/',
  COMPONENTS_CATEGORIES = 'components/categories/',
  GENERATE_FLUTTER_APPLICATION = 'generate/quick_generate/',
  PROJECTS = 'projects/',
  PROJECT = 'projects/{id}/',
  PROJECT_BUILD_ANDROID_APPLICATION_PACKAGE = 'projects/{id}/build_apk/',
  PROJECT_DOWNLOAD_FLUTTER_APPLICATION = 'projects/{id}/download/',
  PROJECT_DOWNLOAD_ANDROID_APPLICATION_PACKAGE = 'projects/{id}/download_apk/',
  PROJECT_GENERATE_FLUTTER_APPLICATION = 'projects/{id}/generate/',
  PROJECT_GENERATION_LOGS = 'projects/{id}/logs/',
  PROJECT_START_LIVE_PREVIEW = 'projects/{id}/start_preview/',
  PROJECT_STOP_LIVE_PREVIEW = 'projects/{id}/stop_preview/',
  PROJECT_UPDATE_LIVE_PREVIEW = 'projects/{id}/update_preview/',
  PROJECT_LIVE_PREVIEW_HEARTBEAT = 'projects/{id}/preview_heartbeat/',
  PROJECT_ACTIVE_LIVE_PREVIEWS = 'projects/active_previews/',
  SCREENS = 'screens/',
  SCREEN = 'screens/{id}/',
}

const getEndpointPathname = (endpoint: ApiEndpointPathnames, resourceId: string | number): string =>
  endpoint.replace('{id}', encodeURIComponent(String(resourceId)));

export { ApiEndpointPathnames, getEndpointPathname };
