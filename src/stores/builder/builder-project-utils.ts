import { createDefaultScreen } from '@/stores/builder/builder-defaults';
import type { FlutterWidget, Project, Screen } from '@/types/screen-types';
import { resolveWidgetProps } from '@/types/screen-types';

const applyDefaultsToWidget = (widget: FlutterWidget): FlutterWidget =>
  ({
    ...widget,
    props: resolveWidgetProps(widget.type, widget.props),
    children: widget.children?.map(applyDefaultsToWidget),
    itemTemplate:
      widget.type === 'ListView' && widget.itemTemplate
        ? applyDefaultsToWidget(widget.itemTemplate)
        : widget.itemTemplate,
  }) as FlutterWidget;

const applyDefaultsToWidgets = (widgets: FlutterWidget[]) => widgets.map(applyDefaultsToWidget);

const normalizeContainerLayoutValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === 'auto') return 0;
  return 0;
};

const normalizeWidgetsForExport = (widgets: FlutterWidget[]): FlutterWidget[] =>
  widgets.map((widget) => {
    const children = widget.children ? normalizeWidgetsForExport(widget.children) : undefined;

    if (widget.type !== 'Container') {
      const itemTemplate =
        widget.type === 'ListView' && widget.itemTemplate
          ? normalizeWidgetsForExport([widget.itemTemplate])[0]
          : widget.itemTemplate;
      return { ...widget, children, itemTemplate } as FlutterWidget;
    }

    const layout = widget.props.layout;
    const normalizedLayout = layout
      ? {
          ...layout,
          w: normalizeContainerLayoutValue(layout.w),
          h: normalizeContainerLayoutValue(layout.h),
        }
      : layout;
    const shouldOmitLayout =
      !normalizedLayout || (normalizedLayout.w === 0 && normalizedLayout.h === 0);
    const { layout: _layout, ...restProps } = widget.props;

    return {
      ...widget,
      props: shouldOmitLayout ? restProps : { ...restProps, layout: normalizedLayout },
      children,
    } as FlutterWidget;
  });

const normalizeScreens = (screens: Screen[]): Screen[] =>
  (screens.length > 0 ? screens : [createDefaultScreen()]).map((screen) => ({
    ...screen,
    components: applyDefaultsToWidgets(screen.components || []),
  }));

const getScreenRoute = (name: string): string => `/${name.toLowerCase().replace(/\s+/g, '-')}`;

const exportProject = (project: Project): Project => ({
  app_name: project.app_name,
  package_name: project.package_name,
  screens: project.screens.map((screen) => ({
    id: screen.id,
    name: screen.name,
    route: screen.route,
    is_home: screen.is_home,
    components: normalizeWidgetsForExport(screen.components),
  })),
});

export {
  applyDefaultsToWidgets,
  exportProject,
  getScreenRoute,
  normalizeScreens,
  normalizeWidgetsForExport,
};
