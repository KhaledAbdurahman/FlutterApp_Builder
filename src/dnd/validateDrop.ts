import {
  FlutterWidget,
  WidgetType,
  getWidgetDefinition,
} from "@/types/flutter";
import {
  VALIDATION_RULES,
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  canAcceptChild,
} from "./validationRules";

export interface ValidationContext {
  widgets: FlutterWidget[]; // The current tree to check ancestry
  getParent: (widgetId: string) => FlutterWidget | null;
}

export interface DragItem {
  id?: string; // If existing widget
  type: WidgetType;
}

export interface DropTarget {
  id: string; // Target widget ID
  type: WidgetType | "canvas";
}

export interface ValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  confidence: "high" | "low";
}

// Recursive helper to find if targetId is a descendant of sourceId
const isDescendant = (
  widgets: FlutterWidget[],
  sourceId: string,
  targetId: string,
): boolean => {
  const source = findWidget(widgets, sourceId);
  if (!source) return false;

  if (!source.children) return false;

  const traverse = (nodes: FlutterWidget[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) return true;
      if (node.children && traverse(node.children)) return true;
    }
    return false;
  };

  return traverse(source.children);
};

const findWidget = (
  widgets: FlutterWidget[],
  id: string,
): FlutterWidget | undefined => {
  for (const w of widgets) {
    if (w.id === id) return w;
    if (w.children) {
      const found = findWidget(w.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

export const validateDrop = (
  source: DragItem,
  destination: DropTarget,
  ctx: ValidationContext,
): ValidationResult => {
  // 1. Basic Type Checks
  if (destination.type === "canvas") {
    // Dropping on root canvas
    // Usually only Scaffold is allowed at root if it's high level, but
    // the current app allows dropping anything on "canvas" which adds it to the list.
    // However, if we drop "Expanded" or "Positioned" on root, that's invalid.
    if (REQUIRED_PARENTS[source.type]) {
      return {
        valid: false,
        confidence: "high",
        message: `${source.type} requires a parent of type ${REQUIRED_PARENTS[source.type]?.join(" or ")}.`,
      };
    }
    return { valid: true, confidence: "high" };
  }

  // 2. Circular Dependency Check (only if moving existing component)
  if (source.id && destination.id) {
    if (source.id === destination.id) {
      return {
        valid: false,
        confidence: "high",
        message: "Cannot move a component into itself.",
      };
    }

    // Check if we are trying to drop a parent into its own child
    if (isDescendant(ctx.widgets, source.id, destination.id)) {
      return {
        valid: false,
        confidence: "high",
        message: `Cannot place ${source.type} inside its own child.`,
      };
    }
  }

  const targetType = destination.type as WidgetType;

  // 3. Capability Check: Can the target accept children?
  if (!canAcceptChild(targetType)) {
    // Special case: Some widgets might accept "actions" (like Button) but not generic children in the tree.
    // In this builder model, children array implies visual nesting.
    return {
      valid: false,
      confidence: "high",
      message: `${targetType} does not accept children components.`,
    };
  }

  // 4. Strict Parent Requirements
  const requiredParents = REQUIRED_PARENTS[source.type];
  if (requiredParents) {
    if (!requiredParents.includes(targetType)) {
      return {
        valid: false,
        confidence: "high",
        message: `${source.type} must be placed inside ${requiredParents.join(" or ")}.`,
      };
    }
  }

  // 5. Root-only constraints
  if (ROOT_ONLY_WIDGETS.includes(source.type)) {
    // Ideally should check if target is Root/Screen.
    // If target is another widget, it's likely invalid.
    return {
      valid: false,
      confidence: "high",
      message: `${source.type} is a top-level component and cannot be nested.`,
    };
  }

  // 6. Explicit Rule Lookup
  const explicitRule = VALIDATION_RULES.find(
    (r) => r.parentType === targetType && r.childType === source.type,
  );

  if (explicitRule) {
    if (explicitRule.result === "forbidden") {
      return {
        valid: false,
        confidence: "high",
        message:
          explicitRule.message ||
          `Cannot place ${source.type} inside ${targetType}.`,
        code: explicitRule.code,
      };
    }
    if (explicitRule.result === "uncertain") {
      return {
        valid: true, // tentatively valid, but requires confirmation
        confidence: "low",
        message: explicitRule.message,
      };
    }
  }

  // 7. Fallback / Default
  return { valid: true, confidence: "high" };
};
