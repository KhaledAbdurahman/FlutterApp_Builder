# Drag and Drop Validation System

This module implements robust error handling and validation for the UI Builder's drag-and-drop interactions.

## Key Files

- `validationRules.ts`: The source of truth for compatibility. Defines `allowed`, `forbidden`, and `uncertain` relationships.
- `validateDrop.ts`: The pure logic function that takes a source, destination, and context to determine if a drop is valid.
- `dndHandlers.tsx`: A React hook (`useDnDHandlers`) that integrates validation, snapshots, toast notifications, and confirmation modals into the existing `BuilderLayout`.

## Adding New Rules

To add a new constraint (e.g., prevent a new widget `VideoPlayer` from being inside a `Button`), edit `validationRules.ts`.

Example:
```typescript
{
  parentType: "Button",
  childType: "VideoPlayer",
  result: "forbidden",
  message: "Buttons cannot contain video players."
}
```

## Ambiguous Cases (Uncertainty)

If a relationship is technically allowed but discouraged (e.g., `ListTile` inside a `Row`), mark it as `uncertain`. This will trigger a confirmation modal for the user.
The user's choice is not currently persisted but allows them to bypass the warning.

## Validation Logic

The validator checks:
1. **Type Compatibility**: Can the target accept children?
2. **Strict Parenting**: Does the child require a specific parent (e.g., `Positioned` -> `Stack`)?
3. **Circular Dependencies**: Is the target a descendant of the source?
4. **Explicit Rules**: Checks the table in `validationRules.ts`.

## Integration

The `useDnDHandlers` hook wraps `@dnd-kit` events.
- **Drag Start**: Captures a snapshot of the component tree.
- **Drag End**:
    - Validates the drop.
    - If **Valid**: Commits the change.
    - If **Invalid**: Shows error toast.
    - If **Uncertain**: Shows confirmation dialog. On Cancel, no change is made (effectively undoing the intent).
