import { describe, it, expect } from 'vitest';
import { validateDrop, ValidationContext, DragItem, DropTarget } from '@/dnd/validateDrop';
import { FlutterWidget } from '@/types/screen-types';

// Mock data
const mockWidgets: FlutterWidget[] = [
  {
    id: 'root-scaffold',
    type: 'Scaffold',
    props: {},
    children: [
      {
        id: 'col-1',
        type: 'Column',
        props: {},
        children: [{ id: 'btn-1', type: 'Button', props: {} }],
      },
    ],
  },
  {
    id: 'container-1',
    type: 'Container',
    props: {},
    children: [],
  },
];

const mockContext: ValidationContext = {
  widgets: mockWidgets,
  getParent: (id) => {
    if (id === 'col-1') return mockWidgets[0];
    if (id === 'btn-1') return mockWidgets[0].children![0];
    return null;
  },
};

describe('validateDrop', () => {
  it('should allow valid drops', () => {
    const source: DragItem = { type: 'Button' };
    const destination: DropTarget = { id: 'col-1', type: 'Column' };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(true);
  });

  it('should forbid nested Scaffolds', () => {
    const source: DragItem = { type: 'Scaffold' };
    const destination: DropTarget = { id: 'col-1', type: 'Column' };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    // Expects the generic root-constraint message usually
    expect(result.message).toContain('Scaffold is a top-level component');
  });

  it('should forbid TextField inside Button', () => {
    const source: DragItem = { type: 'TextField' };
    const destination: DropTarget = { id: 'btn-1', type: 'Button' };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Button allows 0 children');
  });

  it('should enforce Expand -> Flex parent', () => {
    const source: DragItem = { type: 'Expanded' };

    // Invalid parent
    const destInvalid: DropTarget = { id: 'container-1', type: 'Container' };
    expect(validateDrop(source, destInvalid, mockContext).valid).toBe(false);

    // Valid parent
    const destValid: DropTarget = { id: 'col-1', type: 'Column' };
    expect(validateDrop(source, destValid, mockContext).valid).toBe(true);
  });

  it('should enforce single-child wrappers', () => {
    const source: DragItem = { type: 'Text' };
    const firstDrop = validateDrop(source, { id: 'container-1', type: 'Container' }, mockContext);
    expect(firstDrop.valid).toBe(true);

    const occupiedContext: ValidationContext = {
      ...mockContext,
      widgets: [
        {
          id: 'container-1',
          type: 'Container',
          props: {},
          children: [{ id: 'text-1', type: 'Text', props: {} }],
        },
      ],
    };
    const secondDrop = validateDrop(
      source,
      { id: 'container-1', type: 'Container' },
      occupiedContext,
    );
    expect(secondDrop.valid).toBe(false);
    expect(secondDrop.message).toContain('Container allows 1 children');
  });

  it('should require Stack as the direct parent of Positioned', () => {
    const source: DragItem = { type: 'Positioned' };
    const invalidDestination: DropTarget = { id: 'col-1', type: 'Column' };
    expect(validateDrop(source, invalidDestination, mockContext).valid).toBe(false);

    const stackContext: ValidationContext = {
      ...mockContext,
      widgets: [
        {
          id: 'stack-1',
          type: 'Stack',
          props: {},
          children: [],
        },
      ],
    };
    const validDestination: DropTarget = { id: 'stack-1', type: 'Stack' };
    expect(validateDrop(source, validDestination, stackContext).valid).toBe(true);
  });

  it('should allow ListTile in a standard layout parent', () => {
    const source: DragItem = { type: 'ListTile' };
    const destination: DropTarget = { id: 'col-1', type: 'Column' };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(true);
  });

  it('should prevent circular dependency', () => {
    const source: DragItem = { id: 'root-scaffold', type: 'Scaffold' };
    const destination: DropTarget = { id: 'col-1', type: 'Column' };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Cannot place Scaffold inside its own child');
  });
});
