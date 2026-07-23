import {
  FlutterWidget,
  WidgetType,
  getWidgetDefinition,
  getChildConfig,
} from "@/types/screen-types";
import { getWidgetChildren } from "@/lib/widgetTreeUtils";
import {
  VALIDATION_RULES,
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  canAcceptChild,
} from "./validationRules";
import { countDirectChildren } from "./childCounts";

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
  slot?: "appBar" | "drawer" | "bottomNavigationBar" | "body";
  scaffoldContext?: {
    appBarExists: boolean;
    drawerExists: boolean;
    bottomNavExists: boolean;
  };
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

  const sourceChildren = getWidgetChildren(source);
  if (sourceChildren.length === 0) return false;

  const traverse = (nodes: FlutterWidget[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) return true;
      const children = getWidgetChildren(node);
      if (children.length > 0 && traverse(children)) return true;
    }
    return false;
  };

  return traverse(sourceChildren);
};

const findWidget = (
  widgets: FlutterWidget[],
  id: string,
): FlutterWidget | undefined => {
  for (const w of widgets) {
    if (w.id === id) return w;
    const children = getWidgetChildren(w);
    if (children.length > 0) {
      const found = findWidget(children, id);
      if (found) return found;
    }
  }
  return undefined;
};

const formatAllowedCount = (config?: {
  mode: "none" | "single" | "multiple";
  maxChildren?: number;
}) => {
  if (!config) return "0";
  if (config.mode === "none") return "0";
  if (config.mode === "single") return "1";
  if (config.maxChildren) return `up to ${config.maxChildren}`;
  return "unlimited";
};

const getAllowedChildrenForTarget = (
  targetType: WidgetType,
  parentWidget?: FlutterWidget | null,
) => {
  if (targetType === "Column" && parentWidget?.type === "Drawer") {
    return ["ListTile"] as WidgetType[];
  }
  return getChildConfig(targetType)?.allowedChildren;
};

const RESERVED_SCAFFOLD_TYPES: WidgetType[] = [
  "AppBar",
  "Drawer",
  "BottomNavigationBar",
];

const findScaffoldById = (
  widgets: FlutterWidget[],
  id: string,
): FlutterWidget | undefined => {
  const found = findWidget(widgets, id);
  if (found?.type === "Scaffold") return found;
  return undefined;
};

const getScaffoldSlots = (scaffold?: FlutterWidget) => {
  if (!scaffold?.children) {
    return {
      appBar: undefined,
      drawer: undefined,
      bottomNavigationBar: undefined,
      body: undefined,
    };
  }

  const appBar = scaffold.children.find((c) => c.type === "AppBar");
  const drawer = scaffold.children.find((c) => c.type === "Drawer");
  const bottomNavigationBar = scaffold.children.find(
    (c) => c.type === "BottomNavigationBar",
  );
  const body = scaffold.children.find(
    (c) => !RESERVED_SCAFFOLD_TYPES.includes(c.type),
  );

  return { appBar, drawer, bottomNavigationBar, body };
};

export const validateDrop = (
  source: DragItem,
  destination: DropTarget,
  ctx: ValidationContext,
): ValidationResult => {
  // Scaffold slot validation (reserved mounting)
  if (destination.slot) {
    const scaffold = findScaffoldById(ctx.widgets, destination.id);
    const slots = getScaffoldSlots(scaffold);
    const scaffoldContext = destination.scaffoldContext || {
      appBarExists: !!slots.appBar,
      drawerExists: !!slots.drawer,
      bottomNavExists: !!slots.bottomNavigationBar,
    };

    if (destination.slot === "appBar") {
      if (source.type !== "AppBar") {
        return {
          valid: false,
          confidence: "high",
          message: "Only AppBar can be placed in the appBar slot.",
        };
      }
      if (scaffoldContext.appBarExists && slots.appBar?.id !== source.id) {
        return {
          valid: false,
          confidence: "high",
          message: "Scaffold already has an AppBar.",
        };
      }
      return { valid: true, confidence: "high" };
    }

    if (destination.slot === "drawer") {
      if (source.type !== "Drawer") {
        return {
          valid: false,
          confidence: "high",
          message: "Only Drawer can be placed in the drawer slot.",
        };
      }
      if (scaffoldContext.drawerExists && slots.drawer?.id !== source.id) {
        return {
          valid: false,
          confidence: "high",
          message: "Scaffold already has a Drawer.",
        };
      }
      return { valid: true, confidence: "high" };
    }

    if (destination.slot === "bottomNavigationBar") {
      if (source.type !== "BottomNavigationBar") {
        return {
          valid: false,
          confidence: "high",
          message:
            "Only BottomNavigationBar can be placed in the bottomNavigationBar slot.",
        };
      }
      if (
        scaffoldContext.bottomNavExists &&
        slots.bottomNavigationBar?.id !== source.id
      ) {
        return {
          valid: false,
          confidence: "high",
          message: "Scaffold already has a BottomNavigationBar.",
        };
      }
      return { valid: true, confidence: "high" };
    }

    if (destination.slot === "body") {
      if (RESERVED_SCAFFOLD_TYPES.includes(source.type)) {
        return {
          valid: false,
          confidence: "high",
          message:
            "Scaffold reserved widgets cannot be placed in the body slot.",
        };
      }
      if (slots.body && slots.body.id !== source.id) {
        return {
          valid: false,
          confidence: "high",
          message:
            "Scaffold body already has a widget. Only one direct child is allowed.",
        };
      }
      return { valid: true, confidence: "high" };
    }
  }

  if (destination.type === "canvas") {
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

  const targetWidget = findWidget(ctx.widgets, destination.id);

  if (targetWidget) {
    const childConfig = getChildConfig(targetType);
    const currentCount = countDirectChildren(targetWidget);
    const alreadyChild =
      !!source.id &&
      !!getWidgetChildren(targetWidget).some((child) => child.id === source.id);
    const attemptedCount = currentCount + (alreadyChild ? 0 : 1);

    if (childConfig?.mode === "none" && attemptedCount > 0) {
      return {
        valid: false,
        confidence: "high",
        message: `${targetType} allows ${formatAllowedCount(childConfig)} children. Current: ${currentCount}, attempted: ${attemptedCount}.`,
      };
    }

    if (childConfig?.mode === "single" && attemptedCount > 1) {
      return {
        valid: false,
        confidence: "high",
        message: `${targetType} allows ${formatAllowedCount(childConfig)} children. Current: ${currentCount}, attempted: ${attemptedCount}.`,
      };
    }

    if (
      childConfig?.mode === "multiple" &&
      childConfig.maxChildren !== undefined &&
      attemptedCount > childConfig.maxChildren
    ) {
      return {
        valid: false,
        confidence: "high",
        message: `${targetType} allows ${formatAllowedCount(childConfig)} children. Current: ${currentCount}, attempted: ${attemptedCount}.`,
      };
    }

    const allowedChildren = getAllowedChildrenForTarget(
      targetType,
      targetWidget,
    );
    if (allowedChildren && !allowedChildren.includes(source.type)) {
      return {
        valid: false,
        confidence: "high",
        message: `${targetType} allows only [${allowedChildren.join(", ")}] children. Current: ${currentCount}, attempted: ${attemptedCount}.`,
      };
    }
  }

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
        confidence: "low", // TODO add a modal
        message: explicitRule.message,
      };
    }
  }

  // 7. Fallback / Default
  return { valid: true, confidence: "high" };
};
