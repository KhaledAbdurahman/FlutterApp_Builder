import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCcw,
  RotateCw,
  Square,
  Wifi,
} from 'lucide-react';
import { ActionIcon, Button, Progress, Select, Slider, Tooltip } from '@mantine/core';
import { useLivePreview } from '@/pages/builder/hooks/use-live-preview';
import type { ILivePreviewServerStatus } from '@/types/api/live-preview-types';
import { CalculateLivePreviewScale } from '@/utils/live-preview-utils';
import { cn } from '@/lib/utils';
import styles from '@/pages/builder/components/live-preview-panel.module.css';

const PHONE_BEZEL_HORIZONTAL = 20;
const PHONE_BEZEL_VERTICAL = 20;
const PREVIEW_AREA_PADDING = 48;
const MINIMUM_ZOOM = 40;
const MAXIMUM_ZOOM = 100;
const ZOOM_STEP = 10;

const PreviewDevices = {
  iphone14: {
    label: 'iPhone 14',
    width: 390,
    height: 844,
    safeAreaTop: 47,
    cutout: 'notch',
  },
  pixel8: {
    label: 'Pixel 8',
    width: 412,
    height: 915,
    safeAreaTop: 32,
    cutout: 'punch-hole',
  },
  smallAndroid: {
    label: 'Small Android',
    width: 360,
    height: 800,
    safeAreaTop: 24,
    cutout: 'none',
  },
} as const;

type IPreviewDeviceId = keyof typeof PreviewDevices;
type ILivePreviewPhase = ReturnType<typeof useLivePreview>['phase'];

interface ILivePreviewPanelProps {
  open: boolean;
  onClose: () => void;
}

const GetPhaseDetails = (
  phase: ILivePreviewPhase,
  previewServerStatus: ILivePreviewServerStatus,
  previewStatusMessage: string | null,
): { label: string; description: string; progress: number } => {
  if (phase === 'launching') {
    const statusDetails = GetPreviewStatusDetails(previewServerStatus);

    return {
      ...statusDetails,
      description: previewStatusMessage || statusDetails.description,
    };
  }

  switch (phase) {
    case 'saving':
      return {
        label: 'Saving project',
        description: 'Syncing the current editor JSON with the backend.',
        progress: 20,
      };
    case 'generating':
      return {
        label: 'Generating Flutter app',
        description: 'Preparing the Flutter project used by the preview server.',
        progress: 52,
      };
    case 'stopping':
      return {
        label: 'Stopping preview',
        description: 'Closing the Flutter preview process.',
        progress: 94,
      };
    case 'ready':
      return {
        label: 'Live',
        description: 'The Flutter preview is connected.',
        progress: 100,
      };
    case 'error':
      return {
        label: 'Preview failed',
        description: 'The preview could not be started.',
        progress: 100,
      };
    default:
      return {
        label: 'Preparing preview',
        description: 'Getting the editor snapshot ready.',
        progress: 8,
      };
  }
};

const GetPreviewStatusDetails = (
  previewServerStatus: ILivePreviewServerStatus,
): { label: string; description: string; progress: number } => {
  switch (previewServerStatus) {
    case 'starting':
      return {
        label: 'Starting preview',
        description: 'The Flutter preview process is starting.',
        progress: 64,
      };
    case 'getting_dependencies':
      return {
        label: 'Getting dependencies',
        description: 'Flutter is resolving the generated application dependencies.',
        progress: 74,
      };
    case 'compiling':
      return {
        label: 'Compiling Flutter app',
        description: 'Flutter is compiling the web application.',
        progress: 88,
      };
    case 'ready':
      return {
        label: 'Preview ready',
        description: 'The Flutter application is ready to interact with.',
        progress: 100,
      };
    case 'error':
      return {
        label: 'Preview failed',
        description: 'The preview server reported an error.',
        progress: 100,
      };
    case 'stopped':
      return {
        label: 'Preview stopped',
        description: 'The preview server stopped before becoming ready.',
        progress: 100,
      };
    default:
      return {
        label: 'Waiting for preview',
        description: 'Waiting for the preview server to begin.',
        progress: 58,
      };
  }
};

const LivePreviewPanel = ({ open, onClose }: ILivePreviewPanelProps) => {
  const {
    errorMessage,
    frameRevision,
    isUpdating,
    launchPreview,
    phase,
    previewServerStatus,
    previewStatusMessage,
    previewUrl,
    refreshFrame,
    restartPreview,
    updateErrorMessage,
  } = useLivePreview(open);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [deviceId, setDeviceId] = useState<IPreviewDeviceId>('iphone14');
  const [fitScale, setFitScale] = useState(1);
  const [fitToScreen, setFitToScreen] = useState(true);
  const [zoomPercent, setZoomPercent] = useState(80);
  const [loadedFrameKey, setLoadedFrameKey] = useState('');
  const [failedFrameKey, setFailedFrameKey] = useState('');
  const device = PreviewDevices[deviceId];
  const phoneWidth = device.width + PHONE_BEZEL_HORIZONTAL;
  const phoneHeight = device.height + PHONE_BEZEL_VERTICAL;
  const applicationViewportHeight = device.height - device.safeAreaTop;
  const scale = fitToScreen ? fitScale : zoomPercent / 100;
  const phaseDetails = GetPhaseDetails(phase, previewServerStatus, previewStatusMessage);
  const frameKey = `${previewUrl ?? 'empty'}:${frameRevision}`;
  const isFrameLoading =
    phase === 'ready' &&
    previewUrl !== null &&
    loadedFrameKey !== frameKey &&
    failedFrameKey !== frameKey;
  const hasFrameError = failedFrameKey === frameKey;

  useEffect(() => {
    const previewArea = previewAreaRef.current;
    if (!previewArea || !open) return;

    const UpdateFitScale = (): void => {
      const bounds = previewArea.getBoundingClientRect();
      setFitScale(
        CalculateLivePreviewScale(
          bounds.width - PREVIEW_AREA_PADDING,
          bounds.height - PREVIEW_AREA_PADDING,
          phoneWidth,
          phoneHeight,
        ),
      );
    };

    UpdateFitScale();
    const resizeObserver = new ResizeObserver(UpdateFitScale);
    resizeObserver.observe(previewArea);

    return () => resizeObserver.disconnect();
  }, [open, phoneHeight, phoneWidth]);

  const scaledPhoneSize = useMemo(
    () => ({
      height: phoneHeight * scale,
      width: phoneWidth * scale,
    }),
    [phoneHeight, phoneWidth, scale],
  );

  const ChangeZoom = (difference: number): void => {
    setFitToScreen(false);
    setZoomPercent((currentZoom) =>
      Math.min(MAXIMUM_ZOOM, Math.max(MINIMUM_ZOOM, currentZoom + difference)),
    );
  };

  const RefreshPreviewFrame = (): void => {
    setLoadedFrameKey('');
    setFailedFrameKey('');
    refreshFrame();
  };

  const RestartPreviewServer = (): void => {
    setLoadedFrameKey('');
    setFailedFrameKey('');
    void restartPreview();
  };

  if (!open) return null;

  return (
    <section className={styles.panel} aria-label="Live Flutter preview">
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.previewIdentity}>
            <div className={styles.previewIcon}>
              <Wifi size={16} />
            </div>
            <div className={styles.previewTitleGroup}>
              <div className={styles.titleRow}>
                <h2>Live Preview</h2>
                <span
                  className={cn(
                    styles.phaseBadge,
                    phase === 'ready'
                      ? styles.phaseReady
                      : phase === 'error'
                        ? styles.phaseError
                        : styles.phasePending,
                  )}
                >
                  {phase === 'ready' ? (
                    <CheckCircle2 size={12} />
                  ) : phase !== 'error' ? (
                    <Loader2 size={12} className={styles.spinning} />
                  ) : null}
                  {isUpdating && phase === 'ready' ? 'Updating' : phaseDetails.label}
                </span>
              </div>
              <p>Interactive Flutter web preview</p>
            </div>
          </div>

          <div className={styles.controls}>
            <Select
              value={deviceId}
              onChange={(value) => value && setDeviceId(value as IPreviewDeviceId)}
              data={Object.entries(PreviewDevices).map(([id, preset]) => ({
                value: id,
                label: `${preset.label} (${preset.width}x${preset.height})`,
              }))}
              className={styles.deviceSelect}
              aria-label="Preview device"
            />

            <div className={styles.zoomControls}>
              <Tooltip label="Zoom out">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => ChangeZoom(-ZOOM_STEP)}
                  disabled={!fitToScreen && zoomPercent <= MINIMUM_ZOOM}
                  aria-label="Zoom out"
                >
                  <Minus size={16} />
                </ActionIcon>
              </Tooltip>
              <Slider
                value={fitToScreen ? Math.round(fitScale * 100) : zoomPercent}
                min={MINIMUM_ZOOM}
                max={MAXIMUM_ZOOM}
                step={ZOOM_STEP}
                onChange={(value) => {
                  setFitToScreen(false);
                  setZoomPercent(value);
                }}
                className={styles.zoomSlider}
                aria-label="Preview zoom"
              />
              <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
              <Tooltip label="Zoom in">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => ChangeZoom(ZOOM_STEP)}
                  disabled={!fitToScreen && zoomPercent >= MAXIMUM_ZOOM}
                  aria-label="Zoom in"
                >
                  <Plus size={16} />
                </ActionIcon>
              </Tooltip>
            </div>

            <Tooltip label="Fit to screen">
              <ActionIcon
                variant={fitToScreen ? 'light' : 'default'}
                onClick={() => setFitToScreen(true)}
                aria-label="Fit preview to screen"
              >
                <Maximize2 size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Refresh preview page">
              <ActionIcon
                variant="default"
                onClick={RefreshPreviewFrame}
                disabled={phase !== 'ready'}
                aria-label="Refresh preview page"
              >
                <RotateCw size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Regenerate and restart server">
              <ActionIcon
                variant="default"
                onClick={RestartPreviewServer}
                disabled={
                  phase === 'saving' ||
                  phase === 'generating' ||
                  phase === 'launching' ||
                  phase === 'stopping'
                }
                aria-label="Regenerate and restart preview"
              >
                <RefreshCcw size={16} />
              </ActionIcon>
            </Tooltip>
            <Button
              variant="default"
              size="sm"
              leftSection={<Square size={14} fill="currentColor" />}
              onClick={onClose}
            >
              Stop
            </Button>
          </div>
        </div>
      </div>

      {updateErrorMessage && (
        <div className={styles.updateError} role="alert">
          <AlertTriangle size={16} />
          <span>{updateErrorMessage}</span>
          <Button variant="light" color="red" size="sm" onClick={RestartPreviewServer}>
            Restart
          </Button>
        </div>
      )}

      <div ref={previewAreaRef} className={styles.previewArea}>
        <div
          className={styles.scaledPhone}
          style={{
            height: scaledPhoneSize.height,
            width: scaledPhoneSize.width,
          }}
        >
          <div
            className={styles.phoneFrame}
            style={{
              height: phoneHeight,
              transform: `scale(${scale})`,
              width: phoneWidth,
            }}
          >
            <div
              className={styles.phoneViewport}
              style={{
                height: device.height,
                width: device.width,
              }}
            >
              <div
                className={styles.safeArea}
                style={{ height: device.safeAreaTop }}
                aria-hidden="true"
                data-preview-safe-area={deviceId}
              />

              {device.cutout === 'notch' && (
                <div className={styles.notch} aria-hidden="true" data-preview-cutout="notch">
                  <div className={styles.notchSpeaker} />
                </div>
              )}

              {device.cutout === 'punch-hole' && (
                <div
                  className={styles.punchHole}
                  aria-hidden="true"
                  data-preview-cutout="punch-hole"
                />
              )}

              {previewUrl && phase === 'ready' && (
                <iframe
                  key={frameKey}
                  src={previewUrl}
                  title={`${device.label} Flutter live preview`}
                  className={styles.previewFrame}
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                  allow="clipboard-read; clipboard-write"
                  onLoad={() => {
                    setFailedFrameKey('');
                    setLoadedFrameKey(frameKey);
                  }}
                  onError={() => setFailedFrameKey(frameKey)}
                />
              )}

              {(phase !== 'ready' || !previewUrl) && (
                <div
                  className={styles.previewState}
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  {phase === 'error' ? (
                    <div className={styles.stateCard}>
                      <div className={styles.errorIcon}>
                        <AlertTriangle size={24} />
                      </div>
                      <h3>Preview unavailable</h3>
                      <p className={styles.stateDescription}>
                        {errorMessage || phaseDetails.description}
                      </p>
                      <Button
                        className={styles.stateAction}
                        leftSection={<RefreshCcw size={16} />}
                        onClick={() => void launchPreview()}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.stateCard}>
                      <div className={styles.loadingHeader}>
                        <Loader2 size={24} className={styles.spinning} />
                        <div>
                          <p className={styles.loadingTitle}>{phaseDetails.label}</p>
                          <p className={styles.loadingDescription}>{phaseDetails.description}</p>
                        </div>
                      </div>
                      <Progress value={phaseDetails.progress} className={styles.progress} />
                      <p className={styles.progressValue}>{phaseDetails.progress}%</p>
                    </div>
                  )}
                </div>
              )}

              {isFrameLoading && (
                <div
                  className={styles.previewState}
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  <div className={styles.loadingFrameState}>
                    <Loader2 size={24} className={styles.spinning} />
                    <p>Loading Flutter view</p>
                  </div>
                </div>
              )}

              {hasFrameError && (
                <div
                  className={styles.previewState}
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  <div className={styles.stateCard}>
                    <AlertTriangle size={28} className={styles.frameErrorIcon} />
                    <p className={styles.frameErrorTitle}>Preview page failed to load</p>
                    <p className={styles.loadingDescription}>
                      The Flutter server may still be starting or may no longer be reachable.
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className={styles.stateAction}
                      leftSection={<RotateCw size={16} />}
                      onClick={RefreshPreviewFrame}
                    >
                      Reload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { LivePreviewPanel };
