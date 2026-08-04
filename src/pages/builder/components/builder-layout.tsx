import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { TopBar } from '@/pages/builder/components/top-bar';
import { BuilderSidebar } from '@/pages/builder/components/builder-sidebar';
import { PhoneCanvas } from '@/pages/builder/components/phone-canvas';
import { PropertiesPanel } from '@/pages/builder/components/properties-panel';
import { WidgetType, getWidgetDefinition } from '@/types/screen-types';
import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDnDHandlers } from '@/pages/builder/dnd/dnd-handlers';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { LivePreviewPanel } from '@/pages/builder/components/live-preview-panel';

export const BuilderLayout = () => {
  const [activeType, setActiveType] = useState<WidgetType | null>(null);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  const {
    handleDragStart: dndDragStart,
    handleDragEnd: dndDragEnd,
    handleDragCancel: dndDragCancel,
    confirmationDialog,
    setConfirmationDialog,
  } = useDnDHandlers();

  const handleDragStart = (event: DragStartEvent) => {
    dndDragStart(event);
    const data = event.active.data.current;
    if (data?.type === 'new-widget') {
      setActiveType(data.widgetType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    dndDragEnd(event, setActiveType);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    dndDragCancel();
    setActiveType(null);
  };

  const definition = activeType ? getWidgetDefinition(activeType) : null;
  const resolvedIcon = definition
    ? LucideIcons[definition.icon as keyof typeof LucideIcons]
    : undefined;
  const IconComponent: LucideIcon =
    typeof resolvedIcon === 'object' && resolvedIcon !== null && '$$typeof' in resolvedIcon
      ? resolvedIcon
      : LucideIcons.Box;

  return (
    <>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={pointerWithin}
      >
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          <TopBar
            isPreviewOpen={livePreviewOpen}
            onLaunchPreview={() => setLivePreviewOpen(true)}
          />
          <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1 overflow-hidden">
            <ResizablePanel
              id="builder-sidebar"
              order={1}
              defaultSize={22}
              minSize={16}
              maxSize={38}
              className="min-w-0"
            >
              <BuilderSidebar />
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="w-2 bg-border/70 transition-colors hover:bg-primary/20"
              aria-label="Resize builder sidebar"
            />
            <ResizablePanel id="builder-workspace" order={2} minSize={45} className="min-w-0">
              <div className="flex h-full min-w-0 overflow-hidden">
                {!livePreviewOpen && <PhoneCanvas />}
                <LivePreviewPanel
                  open={livePreviewOpen}
                  onClose={() => setLivePreviewOpen(false)}
                />
                <PropertiesPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <DragOverlay>
          {activeType && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-card shadow-glow cursor-grabbing"
            >
              <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center">
                <IconComponent className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">{definition?.label}</span>
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      {confirmationDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              top: confirmationDialog.anchor?.y ?? 24,
              left: confirmationDialog.anchor?.x ?? 24,
              transform: 'translate(-50%, 0)',
            }}
            role="dialog"
            aria-live="polite"
          >
            <div className="rounded-md border bg-popover p-4 shadow-md w-72">
              <p className="text-sm font-medium mb-1">Confirm Placement</p>
              <p className="text-xs text-muted-foreground mb-3">{confirmationDialog.message}</p>
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={confirmationDialog.onCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={confirmationDialog.onConfirm}>
                  Confirm Placement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
