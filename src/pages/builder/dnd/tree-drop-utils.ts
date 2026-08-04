import type { TreeMoveType } from '@/pages/builder/dnd/tree-validation-adapters';

const resolveTreeMoveType = (
  draggedCenterY: number,
  targetTop: number,
  targetHeight: number,
  canHaveChildren: boolean,
  isNamedSlot: boolean,
): TreeMoveType => {
  if (isNamedSlot) return 'inside';

  const relativePosition = (draggedCenterY - targetTop) / Math.max(targetHeight, 1);

  // The middle is intentionally narrower so sibling reordering is easier than accidental nesting.
  if (canHaveChildren && relativePosition >= 0.35 && relativePosition <= 0.65) {
    return 'inside';
  }

  return relativePosition < 0.5 ? 'before' : 'after';
};

const getSiblingReorderIndex = (
  sourceParentId: string | null,
  targetParentId: string | null,
  sourceIndex: number,
  targetIndex: number,
  placeAfter: boolean,
): number => {
  const insertionIndex = targetIndex + (placeAfter ? 1 : 0);

  // Removing an earlier sibling shifts the destination left by one before insertion.
  if (sourceParentId === targetParentId && sourceIndex < insertionIndex) {
    return insertionIndex - 1;
  }

  return insertionIndex;
};

export { getSiblingReorderIndex, resolveTreeMoveType };
