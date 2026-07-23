import {
  ChildSlot,
  ChildSlotKey,
  ComponentType,
  FlutterWidget,
  getChildConfig,
  getWidgetDefinition,
} from "@/types/screen-types";

export type VirtualTreeNode = {
  id: string;
  type: "ItemTemplate";
  parentId: string;
  virtual: true;
  slotKey: ChildSlotKey;
  child?: FlutterWidget;
};

export type TreeNode = FlutterWidget | VirtualTreeNode;

const ITEM_TEMPLATE_SLOT_SUFFIX = "::itemTemplate";

export const getItemTemplateSlotId = (parentId: string) =>
  `${parentId}${ITEM_TEMPLATE_SLOT_SUFFIX}`;

export const isItemTemplateSlotId = (id: string) =>
  id.endsWith(ITEM_TEMPLATE_SLOT_SUFFIX);

export const getItemTemplateSlotParentId = (slotId: string) =>
  slotId.replace(ITEM_TEMPLATE_SLOT_SUFFIX, "");

export const isVirtualNode = (node: TreeNode): node is VirtualTreeNode =>
  (node as VirtualTreeNode).virtual === true;

export const getChildSlots = (type: ComponentType): ChildSlot[] => {
  const def = getWidgetDefinition(type);
  if (def?.childSlots && def.childSlots.length > 0) return def.childSlots;

  const config = getChildConfig(type);
  if (!config || config.mode === "none") return [];

  return [
    {
      key: "children",
      mode: config.mode === "single" ? "single" : "multiple",
    },
  ];
};

export const getWidgetChildren = (widget: FlutterWidget): FlutterWidget[] => {
  const slots = getChildSlots(widget.type);
  const result: FlutterWidget[] = [];

  slots.forEach((slot) => {
    if (slot.key === "children") {
      if (Array.isArray(widget.children)) {
        result.push(...widget.children);
      }
    }
    if (slot.key === "itemTemplate") {
      if (widget.itemTemplate) {
        result.push(widget.itemTemplate);
      }
    }
  });

  return result;
};

export const getTreeChildren = (widget: FlutterWidget): TreeNode[] => {
  const slots = getChildSlots(widget.type);
  const result: TreeNode[] = [];

  slots.forEach((slot) => {
    if (slot.key === "children") {
      if (Array.isArray(widget.children)) {
        result.push(...widget.children);
      }
    }
    if (slot.key === "itemTemplate") {
      result.push({
        id: getItemTemplateSlotId(widget.id),
        type: "ItemTemplate",
        parentId: widget.id,
        virtual: true,
        slotKey: "itemTemplate",
        child: widget.itemTemplate,
      });
    }
  });

  return result;
};
