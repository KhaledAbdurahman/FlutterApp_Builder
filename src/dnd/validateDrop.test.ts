import { describe, it, expect, vi } from "vitest";
import {
  validateDrop,
  ValidationContext,
  DragItem,
  DropTarget,
} from "./validateDrop";
import { FlutterWidget } from "@/types/screen-types";

// Mock data
const mockWidgets: FlutterWidget[] = [
  {
    id: "root-scaffold",
    type: "Scaffold",
    props: {},
    children: [
      {
        id: "col-1",
        type: "Column",
        props: {},
        children: [{ id: "btn-1", type: "Button", props: {} }],
      },
    ],
  },
  {
    id: "container-1",
    type: "Container",
    props: {},
    children: [],
  },
];

const mockContext: ValidationContext = {
  widgets: mockWidgets,
  getParent: (id) => {
    if (id === "col-1") return mockWidgets[0];
    if (id === "btn-1") return mockWidgets[0].children![0];
    return null;
  },
};

describe("validateDrop", () => {
  it("should allow valid drops", () => {
    const source: DragItem = { type: "Button" };
    const destination: DropTarget = { id: "col-1", type: "Column" };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(true);
  });

  it("should forbid nested Scaffolds", () => {
    const source: DragItem = { type: "Scaffold" };
    const destination: DropTarget = { id: "col-1", type: "Column" };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    // Expects the generic root-constraint message usually
    expect(result.message).toContain("Scaffold is a top-level component");
  });

  it("should forbid TextField inside Button", () => {
    const source: DragItem = { type: "TextField" };
    const destination: DropTarget = { id: "btn-1", type: "Button" };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    // Button has childConfig.mode = "none", so it hits capability check first
    expect(result.message).toContain(
      "Button does not accept children components",
    );
  });

  it("should enforce Expand -> Flex parent", () => {
    const source: DragItem = { type: "Expanded" };

    // Invalid parent
    const destInvalid: DropTarget = { id: "container-1", type: "Container" };
    expect(validateDrop(source, destInvalid, mockContext).valid).toBe(false);

    // Valid parent
    const destValid: DropTarget = { id: "col-1", type: "Column" };
    expect(validateDrop(source, destValid, mockContext).valid).toBe(true);
  });

  it("should forbid ListTile outside Drawer", () => {
    const source: DragItem = { type: "ListTile" };
    const destination: DropTarget = { id: "col-1", type: "Column" };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("ListTile must be placed inside Drawer");
  });

  it("should prevent circular dependency", () => {
    const source: DragItem = { id: "root-scaffold", type: "Scaffold" };
    const destination: DropTarget = { id: "col-1", type: "Column" };

    const result = validateDrop(source, destination, mockContext);
    expect(result.valid).toBe(false);
    expect(result.message).toContain(
      "Cannot place Scaffold inside its own child",
    );
  });
});
