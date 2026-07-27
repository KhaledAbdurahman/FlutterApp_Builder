import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROJECT_SERVICE } from '@/api/projects';
import { API_BASE_URL } from '@/config/api/api-client';
import { useAppDispatch, useAppSelector } from '@/config/redux/store';
import { builderActions } from '@/stores/builder/builder-slice';
import { exportProject } from '@/stores/builder/builder-project-utils';
import { selectBuilderState } from '@/stores/builder/builder-selectors';
import type { IProjectId, IProjectJsonData } from '@/types/api/project-types';
import {
  CreateLivePreviewProjectSignature,
  ResolveLivePreviewUrl,
} from '@/utils/live-preview-utils';

const LIVE_PREVIEW_HEARTBEAT_INTERVAL = 15_000;
const LIVE_PREVIEW_UPDATE_DELAY = 900;
const GENERATED_SIGNATURE_KEY_PREFIX = 'live-preview-generated-signature';

type ILivePreviewPhase =
  'idle' | 'saving' | 'generating' | 'launching' | 'ready' | 'stopping' | 'error';

const IsRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const GetErrorMessage = (error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : IsRecord(error) && typeof error.message === 'string'
        ? error.message
        : 'The preview request failed.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('flutter sdk not found')) {
    return `Flutter is not available on the preview server. ${message}`;
  }

  if (
    normalizedMessage.includes('must be generated first') ||
    normalizedMessage.includes('generation must be completed')
  ) {
    return `The generated Flutter project is unavailable. ${message}`;
  }

  if (
    normalizedMessage.includes('network error') ||
    normalizedMessage.includes('failed to fetch')
  ) {
    return 'The preview server could not be reached. Check that the backend is running and accessible.';
  }

  return message;
};

const GetGeneratedSignatureKey = (projectId: IProjectId): string =>
  `${GENERATED_SIGNATURE_KEY_PREFIX}:${String(projectId)}`;

const ReadGeneratedSignature = (projectId: IProjectId): string | null => {
  try {
    return window.sessionStorage.getItem(GetGeneratedSignatureKey(projectId));
  } catch {
    return null;
  }
};

const WriteGeneratedSignature = (projectId: IProjectId, signature: string): void => {
  try {
    window.sessionStorage.setItem(GetGeneratedSignatureKey(projectId), signature);
  } catch {
    // Preview still works when browser storage is unavailable; only stale ZIP detection is reduced.
  }
};

const useLivePreview = (isOpen: boolean) => {
  const dispatch = useAppDispatch();
  const builderState = useAppSelector(selectBuilderState);
  const exportedProject = useMemo(
    () => exportProject(builderState.project),
    [builderState.project],
  );
  const projectJson = useMemo<IProjectJsonData>(
    () => ({
      app_name: exportedProject.app_name,
      package_name: exportedProject.package_name,
      screens: exportedProject.screens,
    }),
    [exportedProject],
  );
  const projectName = builderState.projectTitle.trim() || exportedProject.app_name;
  const activeScreen = exportedProject.screens.find(
    (screen) => screen.id === builderState.activeScreenId,
  );
  const projectSignature = useMemo(
    () => CreateLivePreviewProjectSignature(projectName, projectJson),
    [projectJson, projectName],
  );
  const activeScreenSignature = useMemo(
    () => (activeScreen ? JSON.stringify(activeScreen) : ''),
    [activeScreen],
  );
  const snapshot = useMemo(
    () => ({
      activeScreen,
      activeScreenSignature,
      description: builderState.projectDescription,
      projectId: builderState.serverProjectId,
      projectJson,
      projectName,
      projectSignature,
    }),
    [
      activeScreen,
      activeScreenSignature,
      builderState.projectDescription,
      builderState.serverProjectId,
      projectJson,
      projectName,
      projectSignature,
    ],
  );

  const [phase, setPhase] = useState<ILivePreviewPhase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<IProjectId | null>(null);
  const [frameRevision, setFrameRevision] = useState(0);

  const latestSnapshotRef = useRef(snapshot);
  const phaseRef = useRef<ILivePreviewPhase>('idle');
  const isOpenRef = useRef(isOpen);
  const operationRef = useRef(0);
  const sessionProjectIdRef = useRef<IProjectId | null>(null);
  const launchProjectIdRef = useRef<IProjectId | null>(null);
  const lastSavedProjectSignatureRef = useRef('');
  const lastUpdatedScreenSignatureRef = useRef('');
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const heartbeatFailureCountRef = useRef(0);

  const SetPhase = useCallback((nextPhase: ILivePreviewPhase): void => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const StopPreview = useCallback(
    async (silent = false): Promise<void> => {
      const operationId = ++operationRef.current;
      const projectId = sessionProjectIdRef.current ?? launchProjectIdRef.current;

      sessionProjectIdRef.current = null;
      launchProjectIdRef.current = null;
      setActiveProjectId(null);
      heartbeatFailureCountRef.current = 0;

      if (!silent) {
        SetPhase('stopping');
      }

      try {
        if (projectId !== null) {
          await PROJECT_SERVICE.stopLivePreview(projectId);
        }

        if (operationRef.current !== operationId) return;

        setPreviewUrl(null);
        setErrorMessage(null);
        setUpdateErrorMessage(null);
        setIsUpdating(false);
        SetPhase('idle');
      } catch (error) {
        if (operationRef.current !== operationId) return;

        setPreviewUrl(null);
        setIsUpdating(false);

        if (silent) {
          SetPhase('idle');
          return;
        }

        setErrorMessage(GetErrorMessage(error));
        SetPhase('error');
      }
    },
    [SetPhase],
  );

  const LaunchPreview = useCallback(
    async (forceGeneration = false): Promise<void> => {
      if (
        phaseRef.current === 'saving' ||
        phaseRef.current === 'generating' ||
        phaseRef.current === 'launching' ||
        phaseRef.current === 'stopping'
      ) {
        return;
      }

      const operationId = ++operationRef.current;
      const currentSnapshot = latestSnapshotRef.current;
      let projectId = currentSnapshot.projectId;

      setErrorMessage(null);
      setUpdateErrorMessage(null);
      setPreviewUrl(null);
      setIsUpdating(false);
      SetPhase('saving');

      try {
        let shouldGenerate = forceGeneration;

        if (projectId === null) {
          const savedProject = await PROJECT_SERVICE.create({
            name: currentSnapshot.projectName,
            description: currentSnapshot.description,
            json_data: currentSnapshot.projectJson,
          });

          projectId = savedProject.id;
          shouldGenerate = true;
          dispatch(builderActions.setServerProjectId(savedProject.id));
        } else {
          const remoteProject = await PROJECT_SERVICE.getById(projectId);
          const remoteSignature = CreateLivePreviewProjectSignature(
            remoteProject.name,
            remoteProject.json_data,
          );
          const knownGeneratedSignature = ReadGeneratedSignature(projectId);

          shouldGenerate =
            shouldGenerate ||
            remoteProject.status !== 'completed' ||
            !remoteProject.generated_file ||
            remoteSignature !== currentSnapshot.projectSignature ||
            knownGeneratedSignature !== currentSnapshot.projectSignature;

          await PROJECT_SERVICE.update(projectId, {
            name: currentSnapshot.projectName,
            description: currentSnapshot.description,
            json_data: currentSnapshot.projectJson,
          });
        }

        launchProjectIdRef.current = projectId;

        if (operationRef.current !== operationId || !isOpenRef.current) return;

        if (shouldGenerate) {
          SetPhase('generating');
          const generationResult = await PROJECT_SERVICE.generateFlutterApplication(projectId);

          if (generationResult.status !== 'success') {
            throw new Error(generationResult.message || 'Flutter project generation failed.');
          }

          WriteGeneratedSignature(projectId, currentSnapshot.projectSignature);
        }

        if (operationRef.current !== operationId || !isOpenRef.current) return;

        SetPhase('launching');
        const startResult = await PROJECT_SERVICE.startLivePreview(projectId);

        if (startResult.status !== 'success' || !startResult.preview_url) {
          throw new Error(startResult.message || 'The preview server did not return a URL.');
        }

        if (operationRef.current !== operationId || !isOpenRef.current) {
          await PROJECT_SERVICE.stopLivePreview(projectId);
          return;
        }

        const resolvedUrl = ResolveLivePreviewUrl(
          startResult.preview_url,
          API_BASE_URL,
          window.location.origin,
        );

        launchProjectIdRef.current = null;
        sessionProjectIdRef.current = projectId;
        WriteGeneratedSignature(projectId, currentSnapshot.projectSignature);
        lastSavedProjectSignatureRef.current = currentSnapshot.projectSignature;
        lastUpdatedScreenSignatureRef.current = currentSnapshot.activeScreenSignature;
        heartbeatFailureCountRef.current = 0;
        setActiveProjectId(projectId);
        setPreviewUrl(resolvedUrl);
        setFrameRevision((revision) => revision + 1);
        SetPhase('ready');
      } catch (error) {
        if (operationRef.current !== operationId) return;

        launchProjectIdRef.current = null;
        sessionProjectIdRef.current = null;
        setActiveProjectId(null);
        setErrorMessage(GetErrorMessage(error));
        SetPhase('error');
      }
    },
    [SetPhase, dispatch],
  );

  const RestartPreview = useCallback(async (): Promise<void> => {
    await StopPreview(true);

    if (isOpenRef.current) {
      await LaunchPreview(true);
    }
  }, [LaunchPreview, StopPreview]);

  const RefreshFrame = useCallback((): void => {
    setFrameRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (phaseRef.current === 'idle') {
        void LaunchPreview();
      }
      return;
    }

    void StopPreview(true);
  }, [LaunchPreview, StopPreview, isOpen]);

  useEffect(() => {
    if (!isOpen || phase !== 'ready' || activeProjectId === null) return;

    const SendHeartbeat = async (): Promise<void> => {
      try {
        const response = await PROJECT_SERVICE.sendLivePreviewHeartbeat(activeProjectId);

        if (response.status === 'info') {
          setErrorMessage(response.message || 'The preview session is no longer running.');
          sessionProjectIdRef.current = null;
          setActiveProjectId(null);
          SetPhase('error');
          return;
        }

        heartbeatFailureCountRef.current = 0;
      } catch (error) {
        heartbeatFailureCountRef.current += 1;

        if (heartbeatFailureCountRef.current >= 2) {
          setErrorMessage(`Preview heartbeat failed. ${GetErrorMessage(error)}`);
          SetPhase('error');
        }
      }
    };

    const intervalId = window.setInterval(
      () => void SendHeartbeat(),
      LIVE_PREVIEW_HEARTBEAT_INTERVAL,
    );

    return () => window.clearInterval(intervalId);
  }, [SetPhase, activeProjectId, isOpen, phase]);

  useEffect(() => {
    if (!isOpen || phase !== 'ready' || activeProjectId === null) return;

    const timeoutId = window.setTimeout(() => {
      updateQueueRef.current = updateQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (
            !isOpenRef.current ||
            phaseRef.current !== 'ready' ||
            sessionProjectIdRef.current !== activeProjectId
          ) {
            return;
          }

          const currentSnapshot = latestSnapshotRef.current;
          const projectChanged =
            currentSnapshot.projectSignature !== lastSavedProjectSignatureRef.current;
          const screenChanged =
            currentSnapshot.activeScreenSignature !== lastUpdatedScreenSignatureRef.current;

          if (!projectChanged && !screenChanged) return;

          setIsUpdating(true);
          setUpdateErrorMessage(null);

          try {
            const saveProjectRequest = projectChanged
              ? PROJECT_SERVICE.update(activeProjectId, {
                  name: currentSnapshot.projectName,
                  description: currentSnapshot.description,
                  json_data: currentSnapshot.projectJson,
                })
              : Promise.resolve(null);
            const updatePreviewRequest =
              screenChanged && currentSnapshot.activeScreen
                ? PROJECT_SERVICE.updateLivePreview(activeProjectId, {
                    screen: currentSnapshot.activeScreen,
                  })
                : Promise.resolve(null);
            const [, previewUpdateResponse] = await Promise.all([
              saveProjectRequest,
              updatePreviewRequest,
            ]);

            if (previewUpdateResponse && previewUpdateResponse.status !== 'success') {
              throw new Error(
                previewUpdateResponse.message || 'The preview rejected the live update.',
              );
            }

            if (projectChanged) {
              lastSavedProjectSignatureRef.current = currentSnapshot.projectSignature;
            }

            if (screenChanged) {
              lastUpdatedScreenSignatureRef.current = currentSnapshot.activeScreenSignature;
            }
          } catch (error) {
            setUpdateErrorMessage(`Live update failed. ${GetErrorMessage(error)}`);
          } finally {
            setIsUpdating(false);
          }
        });
    }, LIVE_PREVIEW_UPDATE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [activeProjectId, activeScreenSignature, isOpen, phase, projectSignature]);

  useEffect(
    () => () => {
      isOpenRef.current = false;
      operationRef.current += 1;

      const projectId = sessionProjectIdRef.current ?? launchProjectIdRef.current;
      if (projectId !== null) {
        void PROJECT_SERVICE.stopLivePreview(projectId);
      }
    },
    [],
  );

  return {
    errorMessage,
    frameRevision,
    isUpdating,
    launchPreview: LaunchPreview,
    phase,
    previewUrl,
    refreshFrame: RefreshFrame,
    restartPreview: RestartPreview,
    updateErrorMessage,
  };
};

export { useLivePreview };
