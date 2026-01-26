import { WidgetType, FlutterWidget } from "@/types/screen-types";
import {
  DragItem,
  DropTarget,
  validateDrop,
  ValidationContext,
} from "./validateDrop";

export type TreeMoveType = "inside" | "before" | "after";

export interface TreeMoveIntent {
  movedWidgetId: string;
  movedWidgetType: WidgetType;
  targetWidgetId: string;
  targetWidgetType: WidgetType;
  action: TreeMoveType;
}

export const adaptTreeMoveToValidation = (
  intent: TreeMoveIntent,
  ctx: ValidationContext,
): { source: DragItem; destination: DropTarget } => {
  const {
    movedWidgetId,
    movedWidgetType,
    targetWidgetId,
    targetWidgetType,
    action,
  } = intent;

  const source: DragItem = {
    id: movedWidgetId,
    type: movedWidgetType,
  };

  let destination: DropTarget;

  if (action === "inside") {
    // If dropping INSIDE the target, the target is the parent
    destination = {
      id: targetWidgetId,
      type: targetWidgetType,
    };
  } else {
    // If dropping BEFORE or AFTER, the destination is the target's PARENT
    // We need to resolve the parent of the targetWidgetId
    const parent = ctx.getParent(targetWidgetId);

    if (parent) {
      destination = {
        id: parent.id,
        type: parent.type,
      };
    } else {
      // If no parent found, we are dropping at the root (canvas level)
      // Assuming 'canvas' represents the root list container
      destination = {
        id: "root",
        type: "canvas", // Or "Scaffold" if the root must be scaffold, but generic "canvas" handles top-level
      };
    }
  }

  if (destination.type === "Scaffold") {
    if (movedWidgetType === "AppBar") {
      destination.slot = "appBar";
    } else if (movedWidgetType === "Drawer") {
      destination.slot = "drawer";
    } else if (movedWidgetType === "BottomNavigationBar") {
      destination.slot = "bottomNavigationBar";
    } else {
      destination.slot = "body";
    }
  }

  return { source, destination };
};
