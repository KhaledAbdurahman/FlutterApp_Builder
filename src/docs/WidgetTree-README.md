# Widget Tree & Drag-and-Drop Implementation

This module provides a hierarchical, reorderable tree view of the Flutter widget structure. It integrates with the custom validation engine (`validateDrop`) to ensure no invalid widget combinations are created during drag-and-drop operations.

## Architecture

- **`Component/WidgetTree.tsx`**: The visualization component. Uses `@dnd-kit/sortable` to render a tree. 
  - *Note*: It uses a recursive rendering strategy but exposes all IDs to a single `SortableContext` for flat index lookup compatibility where possible.
- **`hooks/useWidgetTreeDnD.ts`**: The core logic hook.
  - Manages `onDragEnd`.
  - Determines "Intent": Currently heuristics detect "Sibling Reorder" (default) or "Nesting" based on context.
  - Calls `adaptTreeMoveToValidation` to convert abstract tree moves into a `source` and `destination` pair.
  - Calls `validateDrop`.
  - Handles the commit to `builderStore` or rollback.
  - Manages the "Uncertainty" confirmation dialog state.
- **`dnd/treeValidationAdapters.ts`**: A mapping layer that translates `TreeMoveIntent` (moved X to Y with action 'after') into the Validation domain objects (DragItem, DropTarget).

## Feature Set

- **Validation**: Enforces strict rules (e.g., no `Scaffold` inside `Row`, no circular nesting).
- **Ambiguity Handling**: If a rule is "uncertain" (e.g., `ListTile` in `Row`), a confirmation modal appears.
- **Undo/Rollback**: State is snapshotted on drag start. If a move is invalid or cancelled, the state is effectively rolled back (by not committing).

## Optimizations for "Low Confidence"
If the validator returns `confidence: 'low'`, the UI interrupts the flow with a modal asking for user confirmation.

## Adding Rules
See `src/dnd/README.md` for editing `validationRules.ts`.
