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
import { LivePreviewPanel } from '@/pages/builder/components/live-preview-panel';
import { Button, Group, Paper, Text } from '@mantine/core';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import styles from '@/pages/builder/components/builder-layout.module.css';

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
        <div className={styles.builder}>
          <TopBar
            isPreviewOpen={livePreviewOpen}
            onLaunchPreview={() => setLivePreviewOpen(true)}
          />
          <PanelGroup direction="horizontal" className={styles.panelGroup}>
            <Panel id="builder-sidebar" order={1} defaultSize={22} minSize={16} maxSize={38}>
              <BuilderSidebar />
            </Panel>
            <PanelResizeHandle
              className={styles.resizeHandle}
              aria-label="Resize builder sidebar"
            />
            <Panel id="builder-workspace" order={2} minSize={45}>
              <div className={styles.workspace}>
                {!livePreviewOpen && <PhoneCanvas />}
                <LivePreviewPanel
                  open={livePreviewOpen}
                  onClose={() => setLivePreviewOpen(false)}
                />
                <PropertiesPanel />
              </div>
            </Panel>
          </PanelGroup>
        </div>

        <DragOverlay>
          {activeType && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={styles.dragOverlay}
            >
              <div className={styles.dragIcon}>
                <IconComponent size={16} />
              </div>
              <Text size="sm" fw={600}>
                {definition?.label}
              </Text>
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
            <Paper className={styles.confirmation} withBorder shadow="md">
              <Text size="sm" fw={600}>
                Confirm placement
              </Text>
              <Text size="xs" c="dimmed" mt={4} mb="sm">
                {confirmationDialog.message}
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button size="xs" variant="default" onClick={confirmationDialog.onCancel}>
                  Cancel
                </Button>
                <Button size="xs" onClick={confirmationDialog.onConfirm}>
                  Confirm Placement
                </Button>
              </Group>
            </Paper>
          </div>
        </div>
      )}
    </>
  );
};
