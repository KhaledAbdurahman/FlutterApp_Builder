import { FlutterWidget } from "@/types/screen-types";

export const countDirectChildren = (widget?: FlutterWidget | null): number => {
  return widget?.children?.length ?? 0;
};

export const countNestedDescendants = (
  widget?: FlutterWidget | null,
): number => {
  if (!widget?.children || widget.children.length === 0) return 0;
  return widget.children.reduce(
    (total, child) => total + 1 + countNestedDescendants(child),
    0,
  );
};
