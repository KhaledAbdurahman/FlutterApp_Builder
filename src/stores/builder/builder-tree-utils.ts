import { getChildSlots, getWidgetChildren } from '@/lib/widgetTreeUtils';
import type { FlutterWidget } from '@/types/screen-types';

const findWidgetById = (widgets: FlutterWidget[], id: string): FlutterWidget | undefined => {
  for (const widget of widgets) {
    if (widget.id === id) return widget;

    const foundWidget = findWidgetById(getWidgetChildren(widget), id);
    if (foundWidget) return foundWidget;
  }

  return undefined;
};

const findAndUpdateWidget = (
  widgets: FlutterWidget[],
  id: string,
  updater: (widget: FlutterWidget) => FlutterWidget,
): FlutterWidget[] =>
  widgets.map((widget) => {
    if (widget.id === id) return updater(widget);

    const updatedChildren = widget.children
      ? findAndUpdateWidget(widget.children, id, updater)
      : widget.children;
    const updatedTemplate = widget.itemTemplate
      ? findAndUpdateWidget([widget.itemTemplate], id, updater)[0]
      : widget.itemTemplate;

    if (updatedChildren === widget.children && updatedTemplate === widget.itemTemplate) {
      return widget;
    }

    return {
      ...widget,
      children: updatedChildren,
      itemTemplate: updatedTemplate,
    };
  });

const removeWidgetById = (widgets: FlutterWidget[], id: string): FlutterWidget[] =>
  widgets
    .filter((widget) => widget.id !== id)
    .map((widget) => ({
      ...widget,
      children: widget.children ? removeWidgetById(widget.children, id) : undefined,
      itemTemplate: widget.itemTemplate
        ? widget.itemTemplate.id === id
          ? undefined
          : removeWidgetById([widget.itemTemplate], id)[0]
        : widget.itemTemplate,
    }));

const addWidgetToParent = (
  widgets: FlutterWidget[],
  parentId: string,
  newWidget: FlutterWidget,
  index?: number,
): FlutterWidget[] =>
  widgets.map((widget) => {
    if (widget.id === parentId) {
      const slots = getChildSlots(widget.type);
      const hasItemTemplateSlot = slots.some((slot) => slot.key === 'itemTemplate');
      const hasChildrenSlot = slots.some((slot) => slot.key === 'children');

      if (hasItemTemplateSlot && !hasChildrenSlot) {
        return { ...widget, itemTemplate: newWidget };
      }

      const children = widget.children || [];
      const newChildren =
        index !== undefined
          ? [...children.slice(0, index), newWidget, ...children.slice(index)]
          : [...children, newWidget];
      return { ...widget, children: newChildren };
    }

    const updatedChildren = widget.children
      ? addWidgetToParent(widget.children, parentId, newWidget, index)
      : widget.children;
    const updatedTemplate = widget.itemTemplate
      ? addWidgetToParent([widget.itemTemplate], parentId, newWidget, index)[0]
      : widget.itemTemplate;

    if (updatedChildren === widget.children && updatedTemplate === widget.itemTemplate) {
      return widget;
    }

    return {
      ...widget,
      children: updatedChildren,
      itemTemplate: updatedTemplate,
    };
  });

export { addWidgetToParent, findAndUpdateWidget, findWidgetById, removeWidgetById };
