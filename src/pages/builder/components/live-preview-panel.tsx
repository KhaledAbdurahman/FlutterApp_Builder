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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLivePreview } from '@/pages/builder/hooks/use-live-preview';
import type { ILivePreviewServerStatus } from '@/types/api/live-preview-types';
import { CalculateLivePreviewScale } from '@/utils/live-preview-utils';

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
    <section
      className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background"
      aria-label="Live Flutter preview"
    >
      <div className="shrink-0 border-b bg-card px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
              <Wifi className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Live Preview</h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    phase === 'ready'
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                      : phase === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {phase === 'ready' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : phase !== 'error' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {isUpdating && phase === 'ready' ? 'Updating' : phaseDetails.label}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Interactive Flutter web preview
              </p>
            </div>
          </div>

          <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select
                value={deviceId}
                onValueChange={(value) => setDeviceId(value as IPreviewDeviceId)}
              >
                <SelectTrigger className="h-8 w-40" aria-label="Preview device">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PreviewDevices).map(([id, preset]) => (
                    <SelectItem key={id} value={id}>
                      {preset.label} ({preset.width}x{preset.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex h-8 items-center rounded-md border bg-background">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => ChangeZoom(-ZOOM_STEP)}
                      disabled={!fitToScreen && zoomPercent <= MINIMUM_ZOOM}
                      aria-label="Zoom out"
                    >
                      <Minus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>
                <Slider
                  value={[fitToScreen ? Math.round(fitScale * 100) : zoomPercent]}
                  min={MINIMUM_ZOOM}
                  max={MAXIMUM_ZOOM}
                  step={ZOOM_STEP}
                  onValueChange={([value]) => {
                    setFitToScreen(false);
                    setZoomPercent(value);
                  }}
                  className="mx-2 w-20"
                  aria-label="Preview zoom"
                />
                <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                  {Math.round(scale * 100)}%
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => ChangeZoom(ZOOM_STEP)}
                      disabled={!fitToScreen && zoomPercent >= MAXIMUM_ZOOM}
                      aria-label="Zoom in"
                    >
                      <Plus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={fitToScreen ? 'secondary' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setFitToScreen(true)}
                    aria-label="Fit preview to screen"
                  >
                    <Maximize2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to screen</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={RefreshPreviewFrame}
                    disabled={phase !== 'ready'}
                    aria-label="Refresh preview page"
                  >
                    <RotateCw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh preview page</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={RestartPreviewServer}
                    disabled={
                      phase === 'saving' ||
                      phase === 'generating' ||
                      phase === 'launching' ||
                      phase === 'stopping'
                    }
                    aria-label="Regenerate and restart preview"
                  >
                    <RefreshCcw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate and restart server</TooltipContent>
              </Tooltip>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={onClose}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {updateErrorMessage && (
        <div
          className="flex shrink-0 items-center gap-2 border-b border-destructive/25 bg-destructive/8 px-5 py-2 text-xs text-destructive"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{updateErrorMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0"
            onClick={RestartPreviewServer}
          >
            Restart
          </Button>
        </div>
      )}

      <div
        ref={previewAreaRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/35 p-6"
      >
        <div
          className="relative shrink-0"
          style={{
            height: scaledPhoneSize.height,
            width: scaledPhoneSize.width,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left rounded-[48px] bg-[#111316] p-[10px] shadow-[0_24px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
            style={{
              height: phoneHeight,
              transform: `scale(${scale})`,
              width: phoneWidth,
            }}
          >
            <div
              className="relative overflow-hidden rounded-[38px] bg-white"
              style={{
                height: device.height,
                width: device.width,
              }}
            >
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 z-10 bg-white"
                style={{ height: device.safeAreaTop }}
                aria-hidden="true"
                data-preview-safe-area={deviceId}
              />

              {device.cutout === 'notch' && (
                <div
                  className="pointer-events-none absolute left-1/2 top-0 z-20 flex h-[30px] w-[120px] -translate-x-1/2 items-center justify-center rounded-b-[18px] bg-[#111316]"
                  aria-hidden="true"
                  data-preview-cutout="notch"
                >
                  <div className="h-1 w-10 rounded-full bg-white/20" />
                </div>
              )}

              {device.cutout === 'punch-hole' && (
                <div
                  className="pointer-events-none absolute left-1/2 top-[9px] z-20 h-[14px] w-[14px] -translate-x-1/2 rounded-full bg-[#111316] ring-1 ring-black/30"
                  aria-hidden="true"
                  data-preview-cutout="punch-hole"
                />
              )}

              {previewUrl && phase === 'ready' && (
                <iframe
                  key={frameKey}
                  src={previewUrl}
                  title={`${device.label} Flutter live preview`}
                  className="absolute left-0 w-full border-0 bg-white"
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
                  className="absolute left-0 z-10 flex w-full items-center justify-center bg-background p-8"
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  {phase === 'error' ? (
                    <div className="w-full max-w-xs text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-semibold">Preview unavailable</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {errorMessage || phaseDetails.description}
                      </p>
                      <Button type="button" className="mt-5" onClick={() => void launchPreview()}>
                        <RefreshCcw />
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full max-w-xs">
                      <div className="mb-5 flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <div>
                          <p className="text-sm font-semibold">{phaseDetails.label}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {phaseDetails.description}
                          </p>
                        </div>
                      </div>
                      <Progress value={phaseDetails.progress} className="h-1.5" />
                      <p className="mt-2 text-right text-xs tabular-nums text-muted-foreground">
                        {phaseDetails.progress}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isFrameLoading && (
                <div
                  className="absolute left-0 z-10 flex w-full items-center justify-center bg-background"
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-3 text-sm font-medium">Loading Flutter view</p>
                  </div>
                </div>
              )}

              {hasFrameError && (
                <div
                  className="absolute left-0 z-10 flex w-full items-center justify-center bg-background p-8"
                  style={{
                    height: applicationViewportHeight,
                    top: device.safeAreaTop,
                  }}
                >
                  <div className="text-center">
                    <AlertTriangle className="mx-auto h-7 w-7 text-destructive" />
                    <p className="mt-3 text-sm font-semibold">Preview page failed to load</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The Flutter server may still be starting or may no longer be reachable.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={RefreshPreviewFrame}
                    >
                      <RotateCw />
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
