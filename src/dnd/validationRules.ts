// Source of truth for drag-and-drop validation rules
import { WidgetType, WIDGET_DEFINITIONS } from "@/types/screen-types";

export type ValidationRuleType = "allowed" | "forbidden" | "uncertain";

export interface ValidationRule {
  parentType: WidgetType | "root";
  childType: WidgetType;
  result: ValidationRuleType;
  message?: string;
  code?: string;
}

// Helper to check if a widget type matches a category or specific type
const isType = (type: WidgetType, target: WidgetType | WidgetType[]) => {
  if (Array.isArray(target)) return target.includes(type);
  return type === target;
};

// Layout widgets that are strict about their children
const FLEX_CONTAINERS: WidgetType[] = ["Row", "Column"];

export const VALIDATION_RULES: ValidationRule[] = [
  // Rule: Expanded must be inside Row or Column
  {
    parentType: "Row",
    childType: "Expanded",
    result: "allowed",
  },
  {
    parentType: "Column",
    childType: "Expanded",
    result: "allowed",
  },

  // Rule: Scaffold typically shouldn't be nested inside other widgets
  // We treat 'Scaffold' as something that should only be at the root of a Screen
  {
    parentType: "Container",
    childType: "Scaffold",
    result: "forbidden",
    message:
      "Scaffold is a top-level widget and cannot be placed inside a Container.",
  },
  {
    parentType: "Row",
    childType: "Scaffold",
    result: "forbidden",
    message: "Scaffold cannot be placed inside a Row.",
  },
  {
    parentType: "Column",
    childType: "Scaffold",
    result: "forbidden",
    message: "Scaffold cannot be placed inside a Column.",
  },

  // Rule: Buttons shouldn't contain interactive inputs usually (though Flutter allows it, it's bad UX)
  {
    parentType: "Button",
    childType: "TextField",
    result: "forbidden",
    message: "Avoid placing TextFields inside Buttons.",
    code: "BAD_UX",
  },
  {
    parentType: "Button",
    childType: "Button",
    result: "forbidden",
    message: "Avoid nesting Buttons.",
    code: "BAD_UX",
  },

  // Rule: Container can generally accept most things, but warn about heavy layout widgets deep down?
  // No, Container is very flexible.

  // Rule: Card should usually wrap content, not structure roots
  {
    parentType: "Card",
    childType: "Scaffold",
    result: "forbidden",
  },

  // Implicitly allowed:
  // - Center -> Any Child
  // - Padding -> Any Child
  // - SizedBox -> No Child (childConfig.mode = "none" checks this)
  // - Icon, Image, Text -> No Child (childConfig.mode = "none" checks this)
];

// Definition-based checks
export const canAcceptChild = (parentType: WidgetType): boolean => {
  const def = WIDGET_DEFINITIONS.find((w) => w.type === parentType);
  return def?.childConfig.mode !== "none";
};

// Components that strictly require a specific parent
export const REQUIRED_PARENTS: Partial<Record<WidgetType, WidgetType[]>> = {
  Expanded: ["Row", "Column"], // Flex
  AppBar: ["Scaffold"],
  Drawer: ["Scaffold"],
  BottomNavigationBar: ["Scaffold"],
  ListTile: ["Drawer", "Column"],
};

// Components that strictly cannot be children (usually roots)
export const ROOT_ONLY_WIDGETS: WidgetType[] = ["Scaffold"];
