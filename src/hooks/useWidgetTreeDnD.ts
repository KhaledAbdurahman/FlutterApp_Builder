import React, { useState, useCallback, useRef } from "react";
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DropAnimation,
  defaultDropAnimationSideEffects,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBuilderStore } from "@/store/builderStore";
import { toast } from "sonner";
import { validateDrop, ValidationContext } from "@/dnd/validateDrop";
import {
  adaptTreeMoveToValidation,
  TreeMoveIntent,
  TreeMoveType,
} from "@/dnd/treeValidationAdapters";
import { FlutterWidget, getWidgetDefinition } from "@/types/flutter";

// --- Utility: Recursion helpers ---

// Find widget with parent info in a single pass (returns { widget, parentId, index })
const findWidgetWithMeta = (
  nodes: FlutterWidget[],
  id: string,
  parentId: string | null = null,
): { widget: FlutterWidget; parentId: string | null; index: number } | null => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { widget: nodes[i], parentId, index: i };
    }
    if (nodes[i].children) {
      const found = findWidgetWithMeta(nodes[i].children!, id, nodes[i].id);
      if (found) return found;
    }
  }
  return null;
};

// Flatten tree for projection logic (simplifies validation lookups in hooks)
// This is separate from the rendering projection.
const buildValidationContextLookup = (
  widgets: FlutterWidget[],
): ValidationContext => {
  return {
    widgets,
    getParent: (widgetId: string) => {
      // Find parent
      const meta = findWidgetWithMeta(widgets, widgetId);
      if (meta && meta.parentId) {
        const parentMeta = findWidgetWithMeta(widgets, meta.parentId);
        return parentMeta ? parentMeta.widget : null;
      }
      return null;
    },
  };
};

const DND_TOAST_ID = "widget-tree-dnd";

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
    () =>
      React.createElement(
        "div",
        { role: "status", "aria-live": "polite", className: `${base} ${tone}` },
        message,
      ),
    { duration: 2000 },
  );
};

const getWidgetLabel = (widget?: FlutterWidget | null) => {
  if (!widget) return "root";
  const text = typeof widget.props?.text === "string" ? widget.props.text : "";
  return text ? `${widget.type} "${text}"` : widget.type;
};

const getParentWidget = (nodes: FlutterWidget[], widgetId: string) => {
  const meta = findWidgetWithMeta(nodes, widgetId);
  if (!meta?.parentId) return null;
  const parentMeta = findWidgetWithMeta(nodes, meta.parentId);
  return parentMeta?.widget ?? null;
};

export interface UseWidgetTreeDnDProps {
  onCommit?: () => void; // Optional callback after successful move
}

export const useWidgetTreeDnD = ({ onCommit }: UseWidgetTreeDnDProps = {}) => {
  const {
    project,
    activeScreenId,
    getActiveScreen,
    moveWidget,
    setIsDragging,
    setScreenComponents,
    setSelectedWidget,
    selectedWidgetId,
  } = useBuilderStore();

  // Local state for confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    intent: TreeMoveIntent | null;
    anchor?: { x: number; y: number };
  } | null>(null);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const pendingDragIdRef = useRef<string | null>(null);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }), // Prevent accidental drags
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dndToastMessageRef = useRef<string | null>(null);

  const showDndToast = useCallback((message: string, duration = 1600) => {
    if (dndToastMessageRef.current === message) return;
    dndToastMessageRef.current = message;
    toast.message(message, {
      id: DND_TOAST_ID,
      position: "top-center",
      duration,
    });
  }, []);

  const dismissDndToast = useCallback(() => {
    dndToastMessageRef.current = null;
    toast.dismiss(DND_TOAST_ID);
  }, []);

  // Snapshot for undo
  const snapshotRef = useRef<
    Record<
      string,
      { components: FlutterWidget[]; selectedWidgetId: string | null }
    >
  >({});

  const activeScreen = getActiveScreen();
  const flattenedItems = activeScreen ? activeScreen.components : []; // This isn't flat, but handled recursively?
  // Wait, for Sortable, we usually need flattened IDs.
  // For this implementation, we will assume the Tree Component
  // manages the sortable structure (e.g., flattened projection).
  // This hook handles the LOGIC (onDragEnd) mainly.

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setIsDragging(true);
    const dragId = active.id?.toString();

    // Snapshot
    if (activeScreen && dragId) {
      snapshotRef.current[dragId] = {
        components: JSON.parse(JSON.stringify(activeScreen.components)),
        selectedWidgetId,
      };
      const nodes = activeScreen.components;
      const sourceMeta = findWidgetWithMeta(nodes, active.id as string);
      if (sourceMeta) {
        const parentWidget = getParentWidget(nodes, sourceMeta.widget.id);
        showDndToast(
          `Dragging ${getWidgetLabel(sourceMeta.widget)} from ${getWidgetLabel(parentWidget)}`,
          2000,
        );
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    setOverId(over ? over.id : null);

    if (!over) {
      dismissDndToast();
      return;
    }

    const screen = getActiveScreen();
    if (!screen) return;
    const nodes = screen.components;

    const sourceMeta = findWidgetWithMeta(nodes, active.id as string);
    const targetMeta = findWidgetWithMeta(nodes, over.id as string);
    if (!sourceMeta || !targetMeta) return;

    const targetDef = getWidgetDefinition(targetMeta.widget.type);
    const verb = targetDef?.canHaveChildren ? "into" : "after";
    showDndToast(
      `Drop ${getWidgetLabel(sourceMeta.widget)} ${verb} ${getWidgetLabel(targetMeta.widget)}`,
      1200,
    );
  };

  const commitMove = (intent: TreeMoveIntent) => {
    // Execute the move
    const { movedWidgetId, targetWidgetId, action } = intent;

    // Calculate new parent and index based on action
    const screen = getActiveScreen();
    if (!screen) return;
    const nodes = screen.components;

    const sourceMeta = findWidgetWithMeta(nodes, movedWidgetId);
    const targetMeta = findWidgetWithMeta(nodes, targetWidgetId);

    if (sourceMeta && targetMeta) {
      const sourceParentId = sourceMeta.parentId ?? "root";
      const sourceParentWidget = getParentWidget(nodes, sourceMeta.widget.id);

      let destinationParentId: string | null = null;
      let destinationParentWidget: FlutterWidget | null = null;

      if (action === "inside") {
        destinationParentId = targetMeta.widget.id;
        destinationParentWidget = targetMeta.widget;
      } else {
        destinationParentId = targetMeta.parentId ?? "root";
        destinationParentWidget = getParentWidget(nodes, targetMeta.widget.id);
      }

      if (sourceParentId !== destinationParentId) {
        showDndToast(
          `Moved ${getWidgetLabel(sourceMeta.widget)} from ${getWidgetLabel(sourceParentWidget)} to ${getWidgetLabel(destinationParentWidget)}`,
          2000,
        );
      } else {
        showDndToast(
          `Reordered ${getWidgetLabel(sourceMeta.widget)} in ${getWidgetLabel(sourceParentWidget)}`,
          1600,
        );
      }
    }

    if (action === "inside") {
      // Move INSIDE target (append)
      moveWidget(movedWidgetId, targetWidgetId); // No index usually means append
    } else {
      // Before or After
      // 1. Find target's parent and target's index
      const targetMeta = findWidgetWithMeta(nodes, targetWidgetId);
      if (targetMeta) {
        const newIndex =
          action === "after" ? targetMeta.index + 1 : targetMeta.index;
        moveWidget(movedWidgetId, targetMeta.parentId, newIndex);
      }
    }
    onCommit?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    setIsDragging(false);
    const dragId = active.id?.toString();

    if (!over) {
      dismissDndToast();
      return;
    }
    if (active.id === over.id) {
      dismissDndToast();
      return;
    }

    // Note: Since implementing full collision-based intent in this hook without the View details is hard,
    // we will rely on a helper `resolveIntent(active, over)`

    const sourceId = active.id as string;
    const targetId = over.id as string;

    const screen = getActiveScreen();
    if (!screen) return;
    const nodes = screen.components;

    const sourceMeta = findWidgetWithMeta(nodes, sourceId);
    const targetMeta = findWidgetWithMeta(nodes, targetId);

    if (!sourceMeta || !targetMeta) return;

    // Default intent
    let intent: TreeMoveIntent = {
      movedWidgetId: sourceId,
      movedWidgetType: sourceMeta.widget.type,
      targetWidgetId: targetId,
      targetWidgetType: targetMeta.widget.type,
      action: "after", // Default to reorder/sibling
    };

    // HEURISTIC: Handle Nesting into Containers
    const targetDef = getWidgetDefinition(targetMeta.widget.type);
    const canHaveChildren = targetDef?.canHaveChildren;

    // Check if target is a valid container that might be empty or explicitly targeted
    if (canHaveChildren) {
      // If dropping onto a container, we assume intent is to nest inside it
      intent.action = "inside";
    }

    // Validation
    const ctx = buildValidationContextLookup(nodes);
    const { source, destination } = adaptTreeMoveToValidation(intent, ctx);

    const scaffoldTarget =
      destination.type === "Scaffold"
        ? findWidgetWithMeta(nodes, destination.id)?.widget
        : null;
    const scaffoldContext = scaffoldTarget
      ? {
          appBarExists:
            scaffoldTarget.children?.some((c) => c.type === "AppBar") ?? false,
          drawerExists:
            scaffoldTarget.children?.some((c) => c.type === "Drawer") ?? false,
          bottomNavExists:
            scaffoldTarget.children?.some(
              (c) => c.type === "BottomNavigationBar",
            ) ?? false,
        }
      : undefined;

    const result = validateDrop(
      source,
      { ...destination, scaffoldContext },
      ctx,
    );

    if (result.valid) {
      if (result.confidence === "low") {
        const anchor = over.rect
          ? {
              x: over.rect.left + over.rect.width / 2,
              y: over.rect.top + over.rect.height + 8,
            }
          : undefined;
        pendingDragIdRef.current = dragId ?? null;
        setConfirmDialog({
          isOpen: true,
          message: result.message || "Unsure about this placement.",
          intent,
          anchor,
        });
        // Don't commit yet
      } else {
        commitMove(intent);
        if (dragId) delete snapshotRef.current[dragId];
      }
    } else {
      showAccessibleToast(result.message || "Invalid move", "error");
      dismissDndToast();
      // Revert (Snapshot restore)
      restoreSnapshot(dragId);
    }
  };

  const restoreSnapshot = (dragId?: string) => {
    // `dnd-kit` usually handles the revert animation if we just return without updating data.

    if (!dragId) return;
    const snapshot = snapshotRef.current[dragId];
    if (!snapshot) return;
    setScreenComponents(snapshot.components);
    setSelectedWidget(snapshot.selectedWidgetId);
    delete snapshotRef.current[dragId];
  };

  const cancelPendingMove = () => {
    restoreSnapshot(pendingDragIdRef.current ?? undefined);
    pendingDragIdRef.current = null;
    setConfirmDialog(null);
  };

  const confirmPendingMove = (intent?: TreeMoveIntent | null) => {
    if (!intent) return;
    commitMove(intent);
    if (pendingDragIdRef.current) {
      delete snapshotRef.current[pendingDragIdRef.current];
    }
    pendingDragIdRef.current = null;
    setConfirmDialog(null);
  };

  return {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    activeId,
    overId,
    confirmDialog,
    setConfirmDialog,
    commitMove,
    cancelPendingMove,
    confirmPendingMove,
  };
};
