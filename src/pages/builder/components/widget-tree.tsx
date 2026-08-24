import { useCallback, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragOverlay, pointerWithin, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWidgetTreeDnD } from '@/pages/builder/hooks/use-widget-tree-dnd';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import { FlutterWidget, getChildConfig, getWidgetDefinition } from '@/types/screen-types';
import type { LucideIcon } from 'lucide-react';
import {
  VirtualTreeNode,
  getTreeChildren,
  getWidgetChildren,
  isVirtualNode,
} from '@/lib/widgetTreeUtils';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, ChevronDown, Layers, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { ChooseNotification } from '@/lib/choose-notification';
import {
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  VALIDATION_RULES,
} from '@/pages/builder/dnd/validation-rules';
import styles from '@/pages/builder/components/widget-tree.module.css';

interface ITreeNodeProps {
  widget: FlutterWidget;
  depth: number;
  parentId: string | null;
  index: number;
  siblingCount: number;
  onMove: (widgetId: string, parentId: string | null, index: number) => void;
  dropTargetId?: string;
  dropAction?: 'inside' | 'before' | 'after';
}

interface ISlotNodeProps {
  slot: VirtualTreeNode;
  depth: number;
  parent: FlutterWidget;
  onMove: (widgetId: string, parentId: string | null, index: number) => void;
  dropTargetId?: string;
  dropAction?: 'inside' | 'before' | 'after';
}

interface IWidgetTreeProps {
  embedded?: boolean;
}

const isLucideIcon = (icon: unknown): icon is LucideIcon =>
  typeof icon === 'object' && icon !== null && '$$typeof' in icon;

const resolveLucideIcon = (iconName?: string): LucideIcon => {
  const resolvedIcon = iconName ? LucideIcons[iconName as keyof typeof LucideIcons] : undefined;
  return isLucideIcon(resolvedIcon) ? resolvedIcon : LucideIcons.Box;
};

const SlotTreeNode = ({
  slot,
  depth,
  parent,
  onMove,
  dropTargetId,
  dropAction,
}: ISlotNodeProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: 'slot', parentId: parent.id, slotKey: slot.slotKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.slotNode}
      style={{ '--tree-indent': `${depth * 16 + 28}px` } as CSSProperties}
    >
      <div className={cn(styles.slotRow, isOver && styles.slotRowOver)}>
        <span className={styles.iconSpacer} />
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
          dropTargetId={dropTargetId}
          dropAction={dropAction}
        />
      ) : (
        <div
          className={styles.emptySlot}
          style={{ '--tree-indent': `${(depth + 1) * 16 + 28}px` } as CSSProperties}
        >
          Empty
        </div>
      )}
    </div>
  );
};

const SortableTreeNode = ({
  widget,
  depth,
  parentId,
  index,
  siblingCount,
  onMove,
  dropTargetId,
  dropAction,
}: ITreeNodeProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, data: { widget } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    '--tree-indent': `${depth * 16 + 28}px`,
  } as CSSProperties;

  const { selectedWidgetId, setSelectedWidget } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const definition = getWidgetDefinition(widget.type);
  const IconComponent = resolveLucideIcon(definition?.icon);
  const childMode = definition?.childConfig.mode;
  const placementLabel =
    childMode === 'none' ? 'leaf' : childMode === 'single' ? 'one child' : 'children';

  const [isExpanded, setIsExpanded] = useState(true);
  const childNodes = getTreeChildren(widget);
  const hasChildren = childNodes.length > 0;

  const widgetText =
    typeof widget.props === 'object' && widget.props && 'text' in widget.props
      ? (widget.props as { text?: string }).text
      : undefined;

  // Explicit "empty parent" indicator to help drop
  const isEmptyContainer =
    definition?.childConfig.mode !== 'none' && getWidgetChildren(widget).length === 0;
  const activeDropAction = dropTargetId === widget.id ? dropAction : undefined;

  return (
    <div ref={setNodeRef} style={style} className={styles.treeNode}>
      {activeDropAction === 'before' && <div className={styles.dropIndicatorBefore} />}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          styles.treeRow,
          isSelected ? styles.treeRowSelected : styles.treeRowIdle,
          isDragging && styles.treeRowDragging,
          activeDropAction === 'inside' && styles.treeRowInsideTarget,
          isEmptyContainer && styles.treeRowEmptyContainer,
        )}
        onClick={() => setSelectedWidget(widget.id)}
      >
        <span className={styles.depthLabel}>{depth + 1}</span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={styles.dragHandle}
          aria-label={`Move ${widget.type}`}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={styles.expandButton}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className={styles.iconSpacer} />
        )}

        <IconComponent className={styles.widgetIcon} size={16} />
        <span className={styles.widgetType}>{widget.type}</span>
        {widgetText && <span className={styles.widgetText}>"{widgetText}"</span>}
        <span className={styles.placementLabel}>{placementLabel}</span>
        {isSelected && (
          <div className={styles.reorderControls}>
            <button
              type="button"
              className={styles.reorderButton}
              onClick={(event) => {
                event.stopPropagation();
                if (index > 0) onMove(widget.id, parentId, index - 1);
              }}
              aria-label="Move up"
              disabled={index === 0}
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              className={styles.reorderButton}
              onClick={(event) => {
                event.stopPropagation();
                if (index < siblingCount - 1) {
                  onMove(widget.id, parentId, index + 1);
                }
              }}
              aria-label="Move down"
              disabled={index >= siblingCount - 1}
            >
              <ArrowDown size={12} />
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={styles.treeChildren}
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
                    dropTargetId={dropTargetId}
                    dropAction={dropAction}
                  />
                ) : (
                  <SortableTreeNode
                    key={child.id}
                    widget={child}
                    depth={depth + 1}
                    parentId={widget.id}
                    index={actualChildren.findIndex((node) => node.id === child.id)}
                    siblingCount={actualChildren.length}
                    onMove={onMove}
                    dropTargetId={dropTargetId}
                    dropAction={dropAction}
                  />
                ),
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      {activeDropAction === 'after' && <div className={styles.dropIndicatorAfter} />}
    </div>
  );
};

export const WidgetTree = ({ embedded = false }: IWidgetTreeProps) => {
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
    handleDragCancel,
    dropIndicator,
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
      const parentWidget = parentId ? findWidgetById(screen.components, parentId) : null;
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
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const info = findParentInfo(screen.components, selectedWidgetId);
      if (!info) return;
      event.preventDefault();
      const nextIndex = event.key === 'ArrowUp' ? info.index - 1 : info.index + 1;
      if (event.ctrlKey) {
        if (!info.parentId) return;
        const parentInfo = findParentInfo(screen.components, info.parentId);
        if (!parentInfo) return;
        const targetIndex = event.key === 'ArrowUp' ? parentInfo.index : parentInfo.index + 1;
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
          error = `${selected.type} must be inside ${requiredParents.join(' or ')}.`;
        }

        if (!error && targetParent) {
          const targetConfig = getChildConfig(targetParent.type);
          if (targetConfig?.mode === 'none') {
            error = `${targetParent.type} cannot contain children.`;
          }
          if (
            !error &&
            targetConfig?.mode === 'single' &&
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
                rule.result === 'forbidden',
            );
            if (forbiddenRule) {
              error =
                forbiddenRule.message || `${targetParent.type} cannot contain ${selected.type}.`;
            }
          }
        }

        if (error) {
          ChooseNotification.failure({ message: error });
          return;
        }

        handleMove(selectedWidgetId, parentInfo.parentId, targetIndex);
        return;
      }
      if (!event.shiftKey) {
        handleMove(selectedWidgetId, info.parentId, nextIndex);
        return;
      }

      const parentNode = info.parentId ? findWidgetById(screen.components, info.parentId) : null;
      const siblings = parentNode ? parentNode.children || [] : screen.components;
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
        error = `${selected.type} must be inside ${requiredParents.join(' or ')}.`;
      }

      const targetConfig = getChildConfig(target.type);
      if (!error && targetConfig?.mode === 'none') {
        error = `${target.type} cannot contain children.`;
      }

      if (!error && targetConfig?.mode === 'single' && getWidgetChildren(target).length > 0) {
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
            rule.result === 'forbidden',
        );
        if (forbiddenRule) {
          error = forbiddenRule.message || `${target.type} cannot contain ${selected.type}.`;
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
    <div className={cn(styles.tree, !embedded && styles.standalone)}>
      {!embedded && (
        <div className={styles.treeHeader}>
          <Layers size={16} />
          <h2>Widget Tree</h2>
        </div>
      )}

      <div className={styles.treeContent} tabIndex={0} onKeyDown={handleKeyDown}>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={allWidgetIds} strategy={verticalListSortingStrategy}>
            {screen?.components.map((widget, index) => (
              <SortableTreeNode
                key={widget.id}
                widget={widget}
                depth={0}
                parentId={null}
                index={index}
                siblingCount={screen.components.length}
                onMove={handleMove}
                dropTargetId={dropIndicator?.targetId}
                dropAction={dropIndicator?.action}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            <div className={styles.dragOverlay}>Moving Widget...</div>
          </DragOverlay>
        </DndContext>

        {(!screen?.components || screen.components.length === 0) && (
          <p className={styles.emptyTree}>No widgets yet</p>
        )}
      </div>

      {confirmDialog && (
        <div className={styles.anchoredDialogLayer}>
          <div
            className={styles.anchoredDialogPosition}
            style={{
              position: 'absolute',
              top: confirmDialog.anchor?.y ?? 24,
              left: confirmDialog.anchor?.x ?? 24,
              transform: 'translate(-50%, 0)',
            }}
            role="dialog"
            aria-live="polite"
          >
            <div className={styles.anchoredDialog}>
              <Text size="sm" fw={600}>
                Confirm Placement
              </Text>
              <Text size="xs" c="dimmed" mt={4} mb="sm">
                {confirmDialog.message}
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button
                  size="sm"
                  variant="default"
                  radius="md"
                  onClick={() => {
                    cancelPendingMove();
                    ChooseNotification.info({ message: 'Move cancelled' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  radius="md"
                  onClick={() => {
                    confirmPendingMove(confirmDialog.intent);
                    // TODO: Record the user's decision for heuristics.
                  }}
                >
                  Confirm Move
                </Button>
              </Group>
            </div>
          </div>
        </div>
      )}

      {nestDialog && (
        <Modal
          opened
          onClose={() => setNestDialog(null)}
          title="Nest component"
          centered
          radius="md"
          classNames={{ content: styles.modalContent, header: styles.modalHeader }}
        >
          <Text size="sm" c="dimmed" mb="sm">
            Move {nestDialog.widgetLabel} inside {nestDialog.targetLabel}?
          </Text>
          {nestDialog.error && (
            <Text size="xs" c="red" mb="sm">
              {nestDialog.error}
            </Text>
          )}
          <Group justify="flex-end" gap="xs">
            <Button size="sm" variant="default" radius="md" onClick={() => setNestDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              radius="md"
              onClick={() => {
                if (nestDialog.error) return;
                moveWidget(nestDialog.widgetId, nestDialog.targetId);
                setNestDialog(null);
              }}
              disabled={!!nestDialog.error}
            >
              Confirm
            </Button>
          </Group>
        </Modal>
      )}
    </div>
  );
};
