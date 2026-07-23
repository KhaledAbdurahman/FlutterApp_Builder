import { FlutterWidget } from "@/types/screen-types";
import { getWidgetChildren } from "@/lib/widgetTreeUtils";

export const countDirectChildren = (widget?: FlutterWidget | null): number => {
  if (!widget) return 0;
  return getWidgetChildren(widget).length;
};

export const countNestedDescendants = (
  widget?: FlutterWidget | null,
): number => {
  if (!widget) return 0;
  const children = getWidgetChildren(widget);
  if (children.length === 0) return 0;
  return children.reduce(
    (total, child) => total + 1 + countNestedDescendants(child),
    0,
  );
};
