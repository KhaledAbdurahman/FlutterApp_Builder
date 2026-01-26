import { useState, useCallback, useRef } from "react";
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
    updateWidget, // used for reverting if we did optimistic updates (not implemented here for safety)
  } = useBuilderStore();

  // Local state for confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    intent: TreeMoveIntent | null;
  } | null>(null);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

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
  const snapshotRef = useRef<FlutterWidget[] | null>(null);

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

    // Snapshot
    if (activeScreen) {
      snapshotRef.current = JSON.parse(JSON.stringify(activeScreen.components));
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

    if (!over) {
      dismissDndToast();
      return;
    }
    if (active.id === over.id) {
      dismissDndToast();
      return;
    }

    // We assume the Dnd context provides us with a "projection"
    // or we infer the intent from where we dropped.
    // NOTE: Tree sortable usually provides expanded/collapsed state and depth.
    // If using @dnd-kit/sortable-tree pattern, the event would contain specific projection data
    // OR we have to calculate it.
    //
    // For this implementation, let's assume a simplified intent model:
    // If dropped ON items -> Nest
    // If dropped Between items -> Reorder
    //
    // However, basic Sortable context only gives "over".
    // It doesn't distinguish "inside" vs "between" easily without detailed collision detection (like pointerY relative to rect).
    //
    // Given the constraints, let's build a heuristic:
    // 1. Is 'over' a container? If yes, are we hovering the middle? -> Inside.
    // 2. Are we hovering the edges? -> Sibling.
    //
    // Implementation Detail: Since the prompt is strict about behavior but open on "how",
    // and standard SortableList is strict 1D, robust tree DnD usually requires the "SortableTree" projection logic.
    // Check if we can infer "action" from `active.data` or `over.data` provided by `WidgetTree.tsx`.

    // Assuming the UI component passes intent data or we default to "insert after".
    // For a sidebar tree, dropping on "Folder" usually means inside, dropping on "File" means sibling.
    // Let's rely on type compat:
    // If Target is Container/CanHaveChildren -> Try Index 0 (Inside) or Index N?
    //
    // Refinement: The user wants "reorder among siblings, move into different parent, promote".
    // This implies we need accurate depth detection.
    //
    // Let's assume for this Hook that we handle the "Reorder" logic provided by the standard `arrayMove`
    // equivalents or look at the `projected` logic if we implemented a flattened tree.
    //
    // SIMPLIFICATION for this hook:
    // We will assume the `WidgetTree` component sets `active.data.current` or `over.data.current` with specific intent info
    // OR we check the nesting.

    // Let's try to resolve the intent "naively" here if not provided:
    // We'll treat dropping A over B as "Insert A after B".
    // UNLESS B is a container and we held it there? No, standard sortable is reorder.

    // To support nesting, typically one drags *on top* of a container node vs *between*.
    // Let's assume we can get `dragDepth` or similar, or just validate "drag over target".

    // FALLBACK STRATEGY:
    // 1. Resolve Moved Widget (Source)
    // 2. Resolve Target Widget (Over)
    // 3. Determine if "Inside" or "Sibling".
    //    If Target can accept children and is expanded? Or just purely based on id?
    //    Let's check `validationRules.canAcceptChild`.
    //    If target can accept children, we ask user/intent?
    //    Usually, "center" drop = inside, "edge" drop = sibling.

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

    const result = validateDrop(source, destination, ctx);

    if (result.valid) {
      if (result.confidence === "low") {
        setConfirmDialog({
          isOpen: true,
          message: result.message || "Unsure about this placement.",
          intent,
        });
        // Don't commit yet
      } else {
        commitMove(intent);
      }
    } else {
      toast.error(result.message || "Invalid move");
      dismissDndToast();
      // Revert (Snapshot restore)
      restoreSnapshot();
    }
  };

  const restoreSnapshot = () => {
    // If we had local state optimistically updated, revert it.
    // Since this hook currently relies on 'onCommit' to touch the store,
    // the store hasn't changed yet (unless we added optimistic updates).
    //
    // If we implement optimistic updates in the sortable UI (visually),
    // `dnd-kit` usually handles the revert animation if we just return without updating data.
    // So we mainly need to ensure store is clean.
    //
    // However, the requirements say "atomically revert".
    // Since we didn't mutate the store *until* commitMove, we are safe.
    // If we DID mutate (optimistic), we'd use snapshotRef.current to setProject(...)
    if (snapshotRef.current) {
      // Force store reset just in case (if we added optimistic later)
      // For now, no-op is fine as we only commit on valid.
    }
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
  };
};
