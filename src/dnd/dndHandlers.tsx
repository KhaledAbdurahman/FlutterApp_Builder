import { useState, useRef } from "react";
import { DragStartEvent, DragEndEvent, DragCancelEvent } from "@dnd-kit/core";
import { useBuilderStore } from "@/store/builderStore";
import { toast } from "sonner";
import {
  validateDrop,
  ValidationContext,
  DragItem,
  DropTarget,
} from "./validateDrop";
import { WidgetType, FlutterWidget } from "@/types/flutter";

export const useDnDHandlers = () => {
  const {
    addWidget,
    setIsDragging,
    getActiveScreen,
    getWidgetById,
    selectedWidgetId,
  } = useBuilderStore();

  // Snapshot mechanism (unused for simple addWidget but kept for API compliance)
  const snapshotRef = useRef<FlutterWidget[] | null>(null);

  // Confirmation Modal State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Helper to build context
  const getValidationContext = (): ValidationContext => {
    const activeScreen = getActiveScreen();
    const widgets = activeScreen ? activeScreen.components : [];

    return {
      widgets,
      getParent: (widgetId: string) => {
        const findParent = (nodes: FlutterWidget[]): FlutterWidget | null => {
          for (const node of nodes) {
            if (node.children?.some((child) => child.id === widgetId)) {
              return node;
            }
            if (node.children) {
              const found = findParent(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        return findParent(widgets);
      },
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const screen = getActiveScreen();
    if (screen) {
      // Deep clone for snapshot
      snapshotRef.current = JSON.parse(JSON.stringify(screen.components));
    }
    // Pass event handling for UI updates handled by caller if needed
  };

  const handleDragCancel = () => {
    setIsDragging(false);
    snapshotRef.current = null;
  };

  const attemptDrop = (
    source: DragItem,
    destination: DropTarget,
    commitAction: () => void,
  ) => {
    const ctx = getValidationContext();
    const result = validateDrop(source, destination, ctx);

    if (result.valid) {
      if (result.confidence === "low") {
        setIsDragging(false);
        setConfirmationDialog({
          isOpen: true,
          message:
            result.message ||
            "This placement might cause layout issues. Confirm placement?",
          onConfirm: () => {
            commitAction();
            setConfirmationDialog(null);
            snapshotRef.current = null;
          },
          onCancel: () => {
            toast.info("Placement cancelled.");
            setConfirmationDialog(null);
            // If we had optimistically updated, revert here using snapshotRef.current
            snapshotRef.current = null;
          },
        });
      } else {
        commitAction();
        snapshotRef.current = null;
      }
    } else {
      toast.error(result.message || "Invalid drop operation.");
      snapshotRef.current = null;
    }
  };

  const handleDragEnd = (
    event: DragEndEvent,
    activeTypeCallback?: (type: WidgetType | null) => void,
  ) => {
    setIsDragging(false);
    activeTypeCallback?.(null);

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    // Case: Adding New Widget
    if (activeData.type === "new-widget") {
      const widgetType = activeData.widgetType as WidgetType;
      const source: DragItem = { type: widgetType };

      let targetId: string | undefined = undefined;
      let targetType: WidgetType | "canvas" = "canvas";

      // Resolve Target
      if (overData?.type === "widget") {
        targetId = overData.widgetId;
        const w = getWidgetById(targetId!);
        if (w) targetType = w.type;
      } else if (overData?.type === "canvas" || over.id === "canvas-root") {
        // Fallback to selected widget logic if supported
        if (selectedWidgetId) {
          const selectedW = getWidgetById(selectedWidgetId);
          if (selectedW) {
            targetId = selectedWidgetId;
            targetType = selectedW.type;
          }
        }
      }

      const destination: DropTarget = {
        id: targetId || "root",
        type: targetType,
      };

      attemptDrop(source, destination, () => {
        addWidget(widgetType, targetId);
      });
    }
    // Case: Reordering could be added here
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    confirmationDialog,
    setConfirmationDialog,
  };
};
