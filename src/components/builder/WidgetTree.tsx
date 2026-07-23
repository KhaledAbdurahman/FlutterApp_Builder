// Placeholder for a robust visual Tree Component
// This component implements the recursive tree structure and integrates the DnD hook.

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWidgetTreeDnD } from "@/hooks/useWidgetTreeDnD";
import { useBuilderStore } from "@/store/builderStore";
import {
  FlutterWidget,
  getChildConfig,
  getWidgetDefinition,
} from "@/types/screen-types";
import {
  VirtualTreeNode,
  getTreeChildren,
  getWidgetChildren,
  isVirtualNode,
} from "@/lib/widgetTreeUtils";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  VALIDATION_RULES,
} from "@/dnd/validationRules";

interface TreeNodeProps {
  widget: FlutterWidget;
  depth: number;
  parentId: string | null;
  index: number;
  siblingCount: number;
  onMove: (widgetId: string, parentId: string | null, index: number) => void;
}

interface SlotNodeProps {
  slot: VirtualTreeNode;
  depth: number;
  parent: FlutterWidget;
  onMove: (widgetId: string, parentId: string | null, index: number) => void;
}

const SlotTreeNode = ({ slot, depth, parent, onMove }: SlotNodeProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: "slot", parentId: parent.id, slotKey: slot.slotKey },
  });

  return (
    <div ref={setNodeRef} style={{ paddingLeft: `${depth * 16 + 28}px` }}>
      <div
        className={cn(
          "relative flex items-center gap-2 py-2 px-2 rounded-md text-xs uppercase tracking-wide text-muted-foreground",
          isOver && "bg-primary/10 ring-1 ring-primary/30",
        )}
      >
        <span className="w-4" />
        <span>itemTemplate</span>
      </div>
      {slot.child ? (
        <SortableTreeNode
          widget={slot.child}
          depth={depth + 1}
          parentId={parent.id}
          index={0}
          siblingCount={1}
          onMove={onMove}
        />
      ) : (
        <div
          className="text-xs text-muted-foreground/70 italic"
          style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
        >
          Empty
        </div>
      )}
    </div>
  );
};

// Draggable Node Component
const SortableTreeNode = ({
  widget,
  depth,
  parentId,
  index,
  siblingCount,
  onMove,
}: TreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: widget.id, data: { widget } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    paddingLeft: `${depth * 16 + 28}px`,
  };

  const { selectedWidgetId, setSelectedWidget } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const definition = getWidgetDefinition(widget.type);
  const IconComponent = definition
    ? (LucideIcons as any)[definition.icon] || LucideIcons.Box
    : LucideIcons.Box;

  const [isExpanded, setIsExpanded] = useState(true);
  const childNodes = getTreeChildren(widget);
  const hasChildren = childNodes.length > 0;

  const widgetText =
    typeof widget.props === "object" && widget.props && "text" in widget.props
      ? (widget.props as { text?: string }).text
      : undefined;

  // Explicit "empty parent" indicator to help drop
  const isEmptyContainer =
    definition?.childConfig.mode !== "none" &&
    getWidgetChildren(widget).length === 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "relative flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-colors text-sm group w-full min-w-max",
          isSelected
            ? "bg-primary/20 text-primary"
            : "hover:bg-muted text-foreground",
          isDragging && "opacity-50",
          isOver && "bg-primary/10 ring-1 ring-primary/30",
          // Add Drop Zone visual for empty containers if needed (though hook logic handles the action)
          isEmptyContainer && "border border-dashed border-muted-foreground/30",
        )}
        onClick={(e) => {
          setSelectedWidget(widget.id);
        }}
        {...listeners}
      >
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {depth + 1}
        </span>
        <GripVertical className="w-3 h-3 text-muted-foreground/60 group-hover:text-muted-foreground" />
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
        <span className="truncate">{widget.type}</span>
        {widgetText && (
          <span className="text-xs text-muted-foreground truncate max-w-[80px] opacity-70">
            "{widgetText}"
          </span>
        )}
        {isSelected && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                if (index > 0) onMove(widget.id, parentId, index - 1);
              }}
              aria-label="Move up"
              disabled={index === 0}
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                if (index < siblingCount - 1) {
                  onMove(widget.id, parentId, index + 1);
                }
              }}
              aria-label="Move down"
              disabled={index >= siblingCount - 1}
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col"
          >
            {(() => {
              const actualChildren = childNodes.filter(
                (node): node is FlutterWidget => !isVirtualNode(node),
              );

              return childNodes.map((child) =>
                isVirtualNode(child) ? (
                  <SlotTreeNode
                    key={child.id}
                    slot={child}
                    depth={depth + 1}
                    parent={widget}
                    onMove={onMove}
                  />
                ) : (
                  <SortableTreeNode
                    key={child.id}
                    widget={child}
                    depth={depth + 1}
                    parentId={widget.id}
                    index={actualChildren.findIndex(
                      (node) => node.id === child.id,
                    )}
                    siblingCount={actualChildren.length}
                    onMove={onMove}
                  />
                ),
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WidgetTree = () => {
  const { getActiveScreen, selectedWidgetId, moveWidget } = useBuilderStore();
  const screen = getActiveScreen();
  const [nestDialog, setNestDialog] = useState<null | {
    widgetId: string;
    widgetLabel: string;
    targetId: string;
    targetLabel: string;
    error?: string;
  }>(null);

  const {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    confirmDialog,
    cancelPendingMove,
    confirmPendingMove,
  } = useWidgetTreeDnD();

  const allWidgetIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (nodes: FlutterWidget[]) => {
      nodes.forEach((n) => {
        ids.push(n.id);
        const children = getWidgetChildren(n);
        if (children.length > 0) traverse(children);
      });
    };
    if (screen) traverse(screen.components);
    return ids;
  }, [screen]);

  const findParentInfo = useCallback(
    (
      nodes: FlutterWidget[],
      targetId: string,
      parentId: string | null = null,
    ): { parentId: string | null; index: number; length: number } | null => {
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.id === targetId) {
          return { parentId, index: i, length: nodes.length };
        }
        const children = getWidgetChildren(node);
        if (children.length > 0) {
          const found = findParentInfo(children, targetId, node.id);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const findWidgetById = useCallback(
    (nodes: FlutterWidget[], targetId: string): FlutterWidget | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        const children = getWidgetChildren(node);
        if (children.length > 0) {
          const found = findWidgetById(children, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const handleMove = useCallback(
    (widgetId: string, parentId: string | null, nextIndex: number) => {
      if (!screen) return;
      const parentWidget = parentId
        ? findWidgetById(screen.components, parentId)
        : null;
      const siblingCount = parentWidget
        ? getWidgetChildren(parentWidget).length
        : screen.components.length;
      if (!siblingCount) return;
      if (nextIndex < 0 || nextIndex > siblingCount) return;
      moveWidget(widgetId, parentId, nextIndex);
    },
    [screen, findWidgetById, moveWidget],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!selectedWidgetId || !screen) return;
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const info = findParentInfo(screen.components, selectedWidgetId);
      if (!info) return;
      event.preventDefault();
      const nextIndex =
        event.key === "ArrowUp" ? info.index - 1 : info.index + 1;
      if (event.ctrlKey) {
        if (!info.parentId) return;
        const parentInfo = findParentInfo(screen.components, info.parentId);
        if (!parentInfo) return;
        const targetIndex =
          event.key === "ArrowUp" ? parentInfo.index : parentInfo.index + 1;
        const selected = findWidgetById(screen.components, selectedWidgetId);
        if (!selected) return;

        let error: string | undefined;
        const targetParentId = parentInfo.parentId;
        const targetParent = targetParentId
          ? findWidgetById(screen.components, targetParentId)
          : null;

        if (ROOT_ONLY_WIDGETS.includes(selected.type)) {
          error = `${selected.type} can only be at the screen root.`;
        }

        const requiredParents = REQUIRED_PARENTS[selected.type];
        if (
          !error &&
          requiredParents &&
          (!targetParent || !requiredParents.includes(targetParent.type))
        ) {
          error = `${selected.type} must be inside ${requiredParents.join(" or ")}.`;
        }

        if (!error && targetParent) {
          const targetConfig = getChildConfig(targetParent.type);
          if (targetConfig?.mode === "none") {
            error = `${targetParent.type} cannot contain children.`;
          }
          if (
            !error &&
            targetConfig?.mode === "single" &&
            getWidgetChildren(targetParent).length > 0
          ) {
            error = `${targetParent.type} allows only one child and is already occupied.`;
          }
          if (
            !error &&
            targetConfig?.allowedChildren &&
            !targetConfig.allowedChildren.includes(selected.type)
          ) {
            error = `${targetParent.type} does not allow ${selected.type} as a child.`;
          }
          if (!error) {
            const forbiddenRule = VALIDATION_RULES.find(
              (rule) =>
                rule.parentType === targetParent.type &&
                rule.childType === selected.type &&
                rule.result === "forbidden",
            );
            if (forbiddenRule) {
              error =
                forbiddenRule.message ||
                `${targetParent.type} cannot contain ${selected.type}.`;
            }
          }
        }

        if (error) {
          toast.error(error);
          return;
        }

        handleMove(selectedWidgetId, parentInfo.parentId, targetIndex);
        return;
      }
      if (!event.shiftKey) {
        handleMove(selectedWidgetId, info.parentId, nextIndex);
        return;
      }

      const parentNode = info.parentId
        ? findWidgetById(screen.components, info.parentId)
        : null;
      const siblings = parentNode
        ? parentNode.children || []
        : screen.components;
      const target = siblings[nextIndex];
      if (!target) return;

      const selected = findWidgetById(screen.components, selectedWidgetId);
      if (!selected) return;

      let error: string | undefined;

      if (ROOT_ONLY_WIDGETS.includes(selected.type)) {
        error = `${selected.type} can only be at the screen root.`;
      }

      const requiredParents = REQUIRED_PARENTS[selected.type];
      if (!error && requiredParents && !requiredParents.includes(target.type)) {
        error = `${selected.type} must be inside ${requiredParents.join(" or ")}.`;
      }

      const targetConfig = getChildConfig(target.type);
      if (!error && targetConfig?.mode === "none") {
        error = `${target.type} cannot contain children.`;
      }

      if (
        !error &&
        targetConfig?.mode === "single" &&
        getWidgetChildren(target).length > 0
      ) {
        error = `${target.type} allows only one child and is already occupied.`;
      }

      if (
        !error &&
        targetConfig?.allowedChildren &&
        !targetConfig.allowedChildren.includes(selected.type)
      ) {
        error = `${target.type} does not allow ${selected.type} as a child.`;
      }

      if (!error) {
        const forbiddenRule = VALIDATION_RULES.find(
          (rule) =>
            rule.parentType === target.type &&
            rule.childType === selected.type &&
            rule.result === "forbidden",
        );
        if (forbiddenRule) {
          error =
            forbiddenRule.message ||
            `${target.type} cannot contain ${selected.type}.`;
        }
      }

      setNestDialog({
        widgetId: selected.id,
        widgetLabel: selected.type,
        targetId: target.id,
        targetLabel: target.type,
        error,
      });
    },
    [selectedWidgetId, screen, findParentInfo, findWidgetById, handleMove],
  );

  return (
    <div className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Widget Tree
        </h2>
      </div>

      <div
        className="flex-1 overflow-auto p-2 scrollbar-thin"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allWidgetIds}
            strategy={verticalListSortingStrategy}
          >
            {screen?.components.map((widget, index) => (
              <SortableTreeNode
                key={widget.id}
                widget={widget}
                depth={0}
                parentId={null}
                index={index}
                siblingCount={screen.components.length}
                onMove={handleMove}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            <div className="bg-primary/90 text-primary-foreground p-2 rounded shadow-lg text-sm">
              Moving Widget...
            </div>
          </DragOverlay>
        </DndContext>

        {(!screen?.components || screen.components.length === 0) && (
          <p className="text-muted-foreground text-sm text-center p-4">
            No widgets yet
          </p>
        )}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="pointer-events-auto"
            style={{
              position: "absolute",
              top: confirmDialog.anchor?.y ?? 24,
              left: confirmDialog.anchor?.x ?? 24,
              transform: "translate(-50%, 0)",
            }}
            role="dialog"
            aria-live="polite"
          >
            <div className="rounded-md border bg-popover p-4 shadow-md w-72">
              <p className="text-sm font-medium mb-1">Confirm Placement</p>
              <p className="text-xs text-muted-foreground mb-3">
                {confirmDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    cancelPendingMove();
                    toast.custom(() => (
                      <div
                        role="status"
                        aria-live="polite"
                        className="pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md bg-background text-foreground"
                      >
                        Move cancelled
                      </div>
                    ));
                    toast.dismiss("widget-tree-dnd");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    confirmPendingMove(confirmDialog.intent);
                    // TODO: Record the user's decision for heuristics.
                  }}
                >
                  Confirm Move
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {nestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 rounded-md border bg-popover p-4 shadow-md w-80">
            <p className="text-sm font-medium mb-1">Nest component</p>
            <p className="text-xs text-muted-foreground mb-3">
              Move {nestDialog.widgetLabel} inside {nestDialog.targetLabel}?
            </p>
            {nestDialog.error && (
              <p className="text-xs text-destructive mb-3">
                {nestDialog.error}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNestDialog(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (nestDialog.error) return;
                  moveWidget(nestDialog.widgetId, nestDialog.targetId);
                  setNestDialog(null);
                }}
                disabled={!!nestDialog.error}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
