import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { TopBar } from "./TopBar";
import { WidgetPalette } from "./WidgetPalette";
import { PhoneCanvas } from "./PhoneCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { WidgetTree } from "./WidgetTree";
import { WidgetType, getWidgetDefinition } from "@/types/screen-types";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { useDnDHandlers } from "@/dnd/dndHandlers";
import { Button } from "@/components/ui/button";

export const BuilderLayout = () => {
  const [activeType, setActiveType] = useState<WidgetType | null>(null);

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
    if (data?.type === "new-widget") {
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
  const IconComponent = definition
    ? (LucideIcons as any)[definition.icon] || LucideIcons.Box
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
          <TopBar />
          <div className="flex-1 flex overflow-hidden">
            <WidgetPalette />
            <WidgetTree />
            <PhoneCanvas />
            <PropertiesPanel />
          </div>
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
              position: "absolute",
              top: confirmationDialog.anchor?.y ?? 24,
              left: confirmationDialog.anchor?.x ?? 24,
              transform: "translate(-50%, 0)",
            }}
            role="dialog"
            aria-live="polite"
          >
            <div className="rounded-md border bg-popover p-4 shadow-md w-72">
              <p className="text-sm font-medium mb-1">Confirm Placement</p>
              <p className="text-xs text-muted-foreground mb-3">
                {confirmationDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={confirmationDialog.onCancel}
                >
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
