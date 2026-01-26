// Placeholder for a robust visual Tree Component
// This component implements the recursive tree structure and integrates the DnD hook.

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWidgetTreeDnD } from "@/hooks/useWidgetTreeDnD";
import { useBuilderStore } from "@/store/builderStore";
import { FlutterWidget, getWidgetDefinition } from "@/types/flutter";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { ChevronRight, ChevronDown, Layers, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TreeNodeProps {
  widget: FlutterWidget;
  depth: number;
}

// Draggable Node Component
const SortableTreeNode = ({ widget, depth }: TreeNodeProps) => {
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
    paddingLeft: `${depth * 16 + 8}px`,
  };

  const { selectedWidgetId, setSelectedWidget } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const definition = getWidgetDefinition(widget.type);
  const IconComponent = definition
    ? (LucideIcons as any)[definition.icon] || LucideIcons.Box
    : LucideIcons.Box;

  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = widget.children && widget.children.length > 0;

  // Explicit "empty parent" indicator to help drop
  const isEmptyContainer =
    definition?.canHaveChildren &&
    (!widget.children || widget.children.length === 0);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-colors text-sm group w-full min-w-max",
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
        {widget.props.text && (
          <span className="text-xs text-muted-foreground truncate max-w-[80px] opacity-70">
            "{widget.props.text}"
          </span>
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
            {widget.children!.map((child) => (
              <SortableTreeNode
                key={child.id}
                widget={child}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WidgetTree = () => {
  const { getActiveScreen } = useBuilderStore();
  const screen = getActiveScreen();

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
        if (n.children) traverse(n.children);
      });
    };
    if (screen) traverse(screen.components);
    return ids;
  }, [screen]);

  return (
    <div className="w-80 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Widget Tree
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-2 scrollbar-thin">
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
            {screen?.components.map((widget) => (
              <SortableTreeNode key={widget.id} widget={widget} depth={0} />
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
    </div>
  );
};
