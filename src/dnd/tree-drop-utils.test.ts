import { describe, expect, it } from 'vitest';
import { getSiblingReorderIndex, resolveTreeMoveType } from '@/dnd/tree-drop-utils';

describe('resolveTreeMoveType', () => {
  it('uses the top and bottom of a row for sibling ordering', () => {
    expect(resolveTreeMoveType(108, 100, 40, true, false)).toBe('before');
    expect(resolveTreeMoveType(132, 100, 40, true, false)).toBe('after');
  });

  it('uses the center of a container for nesting', () => {
    expect(resolveTreeMoveType(120, 100, 40, true, false)).toBe('inside');
  });

  it('never nests into a leaf widget', () => {
    expect(resolveTreeMoveType(120, 100, 40, false, false)).toBe('after');
  });

  it('always places a widget inside a named slot', () => {
    expect(resolveTreeMoveType(100, 100, 40, false, true)).toBe('inside');
  });
});

describe('getSiblingReorderIndex', () => {
  it('accounts for the source removal when moving forward', () => {
    expect(getSiblingReorderIndex('parent', 'parent', 0, 2, true)).toBe(2);
  });

  it('keeps the target index when moving backward', () => {
    expect(getSiblingReorderIndex('parent', 'parent', 2, 0, false)).toBe(0);
  });

  it('does not adjust moves between different parents', () => {
    expect(getSiblingReorderIndex('source', 'target', 0, 2, true)).toBe(3);
  });
});
