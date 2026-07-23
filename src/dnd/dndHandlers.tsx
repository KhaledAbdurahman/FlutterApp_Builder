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
import {
  WidgetType,
  FlutterWidget,
  getChildConfig,
} from "@/types/screen-types";
import { countDirectChildren } from "./childCounts";
import { getWidgetChildren } from "@/lib/widgetTreeUtils";

const RESERVED_SCAFFOLD_TYPES: WidgetType[] = [
  "AppBar",
  "Drawer",
  "BottomNavigationBar",
];

const getScaffoldFromWidgets = (widgets: FlutterWidget[]) =>
  widgets.find((w) => w.type === "Scaffold");

const getScaffoldContext = (scaffold?: FlutterWidget) => {
  const children = scaffold?.children || [];
  return {
    appBarExists: children.some((c) => c.type === "AppBar"),
    drawerExists: children.some((c) => c.type === "Drawer"),
    bottomNavExists: children.some((c) => c.type === "BottomNavigationBar"),
  };
};

const getScaffoldBodyChild = (scaffold?: FlutterWidget) => {
  const children = scaffold?.children || [];
  return children.find((c) => !RESERVED_SCAFFOLD_TYPES.includes(c.type));
};

const getScaffoldSlotForType = (type: WidgetType) => {
  if (type === "AppBar") return "appBar";
  if (type === "Drawer") return "drawer";
  if (type === "BottomNavigationBar") return "bottomNavigationBar";
  return "body";
};

const findWidgetById = (
  nodes: FlutterWidget[],
  id: string,
): FlutterWidget | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const children = getWidgetChildren(node);
    if (children.length > 0) {
      const found = findWidgetById(children, id);
      if (found) return found;
    }
  }
  return null;
};

const formatAllowedCount = (config?: {
  mode: "none" | "single" | "multiple";
  maxChildren?: number;
}) => {
  if (!config) return "0";
  if (config.mode === "none") return "0";
  if (config.mode === "single") return "1";
  if (config.maxChildren) return `up to ${config.maxChildren}`;
  return "unlimited";
};

const findAncestorMultiTarget = (
  startId: string,
  source: DragItem,
  ctx: ValidationContext,
): { id: string; type: WidgetType } | null => {
  let currentId: string | null = startId;

  while (currentId) {
    const parent = ctx.getParent(currentId);
    if (!parent) return null;
    if (parent.type === "Scaffold") return null;

    const config = getChildConfig(parent.type);
    if (config?.mode === "multiple") {
      const result = validateDrop(
        source,
        { id: parent.id, type: parent.type },
        ctx,
      );
      if (result.valid) {
        return { id: parent.id, type: parent.type };
      }
    }

    currentId = parent.id;
  }

  return null;
};

const showAccessibleToast = (
  message: string,
  variant: "info" | "error" = "info",
) => {
  const base =
    "pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md bg-background text-foreground";
  const tone =
    variant === "error"
      ? "border-destructive text-destructive"
      : "border-border";
  toast.custom(
    () => (
      <div role="status" aria-live="polite" className={`${base} ${tone}`}>
        {message}
      </div>
    ),
    { duration: 2000 },
  );
};

export const useDnDHandlers = () => {
  const {
    addWidget,
    setIsDragging,
    getActiveScreen,
    getWidgetById,
    selectedWidgetId,
    setScreenComponents,
    setSelectedWidget,
  } = useBuilderStore();

  // Snapshot mechanism (unused for simple addWidget but kept for API compliance)
  const snapshotRef = useRef<
    Record<
      string,
      { components: FlutterWidget[]; selectedWidgetId: string | null }
    >
  >({});

  // Confirmation Modal State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    anchor?: { x: number; y: number };
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
            const children = getWidgetChildren(node);
            if (children.some((child) => child.id === widgetId)) {
              return node;
            }
            if (children.length > 0) {
              const found = findParent(children);
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
    const dragId = event.active.id?.toString();
    const screen = getActiveScreen();
    if (screen && dragId) {
      // Deep clone for snapshot
      snapshotRef.current[dragId] = {
        components: JSON.parse(JSON.stringify(screen.components)),
        selectedWidgetId,
      };
    }
    // Pass event handling for UI updates handled by caller if needed
  };

  const handleDragCancel = () => {
    setIsDragging(false);
    snapshotRef.current = {};
  };

  const restoreSnapshot = (dragId?: string) => {
    if (!dragId) return;
    const snapshot = snapshotRef.current[dragId];
    if (!snapshot) return;
    setScreenComponents(snapshot.components);
    setSelectedWidget(snapshot.selectedWidgetId);
    delete snapshotRef.current[dragId];
  };

  const attemptDrop = (
    source: DragItem,
    destination: DropTarget,
    commitAction: () => void,
    dragId?: string,
    anchorRect?: { top: number; left: number; width: number; height: number },
  ) => {
    const ctx = getValidationContext();
    const result = validateDrop(source, destination, ctx);

    if (result.valid) {
      if (result.confidence === "low") {
        setIsDragging(false);
        const anchor = anchorRect
          ? {
              x: anchorRect.left + anchorRect.width / 2,
              y: anchorRect.top + anchorRect.height + 8,
            }
          : undefined;
        setConfirmationDialog({
          isOpen: true,
          message:
            result.message ||
            "This placement might cause layout issues. Confirm placement?",
          onConfirm: () => {
            commitAction();
            setConfirmationDialog(null);
            if (dragId) delete snapshotRef.current[dragId];
            // TODO: Record the user's decision for heuristics.
          },
          onCancel: () => {
            showAccessibleToast("Placement cancelled.", "info");
            setConfirmationDialog(null);
            restoreSnapshot(dragId);
          },
          anchor,
        });
      } else {
        commitAction();
        if (dragId) delete snapshotRef.current[dragId];
      }
    } else {
      showAccessibleToast(result.message || "Invalid drop operation.", "error");
      restoreSnapshot(dragId);
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
    const dragId = active.id?.toString();

    if (!activeData) return;

    // Case: Adding New Widget
    if (activeData.type === "new-widget") {
      const widgetType = activeData.widgetType as WidgetType;
      const source: DragItem = { type: widgetType };

      let targetId: string | undefined = undefined;
      let targetType: WidgetType | "canvas" = "canvas";
      let slot: DropTarget["slot"] = undefined;

      // Resolve Target
      if (overData?.type === "scaffold-slot") {
        targetId = overData.scaffoldId;
        targetType = "Scaffold";
        slot = overData.slot;
      } else if (overData?.type === "widget") {
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

      const screen = getActiveScreen();
      const scaffold = screen
        ? getScaffoldFromWidgets(screen.components)
        : undefined;
      const scaffoldContext = getScaffoldContext(scaffold);

      const scaffoldBody = getScaffoldBodyChild(scaffold);

      if (RESERVED_SCAFFOLD_TYPES.includes(widgetType) && scaffold) {
        targetId = scaffold.id;
        targetType = "Scaffold";
        slot = getScaffoldSlotForType(widgetType);
      } else if (targetType === "Scaffold" && !slot) {
        if (scaffoldBody) {
          targetId = scaffoldBody.id;
          targetType = scaffoldBody.type;
          slot = undefined;
        } else {
          slot = "body";
        }
      } else if (
        overData?.type === "scaffold-slot" &&
        !RESERVED_SCAFFOLD_TYPES.includes(widgetType)
      ) {
        if (scaffoldBody) {
          targetId = scaffoldBody.id;
          targetType = scaffoldBody.type;
          slot = undefined;
        } else {
          slot = "body";
        }
      }

      const ctx = getValidationContext();

      if (targetId && targetType !== "canvas" && !slot) {
        const targetWidget = findWidgetById(ctx.widgets, targetId);
        const config = getChildConfig(targetType as WidgetType);
        if (
          targetWidget &&
          config?.mode === "single" &&
          countDirectChildren(targetWidget) >= 1
        ) {
          const fallback = findAncestorMultiTarget(targetId, source, ctx);
          if (fallback) {
            targetId = fallback.id;
            targetType = fallback.type;
          } else {
            const currentCount = countDirectChildren(targetWidget);
            const attemptedCount = currentCount + 1;
            showAccessibleToast(
              `${targetType} allows ${formatAllowedCount(config)} children. Current: ${currentCount}, attempted: ${attemptedCount}. No multi-child component found before Scaffold.`,
              "error",
            );
            restoreSnapshot(dragId);
            return;
          }
        }
      }

      const destination: DropTarget = {
        id: targetId || "root",
        type: targetType,
        slot,
        scaffoldContext,
      };

      attemptDrop(
        source,
        destination,
        () => {
          // TODO: Define expected behavior when dropping a reserved scaffold widget and no Scaffold exists.
          addWidget(widgetType, targetId);
        },
        dragId,
        over.rect,
      );
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
