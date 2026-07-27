import { createDefaultScreen } from '@/stores/builder/builder-defaults';
import type { ActionBase, FlutterWidget, Project, Screen } from '@/types/screen-types';
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

const normalizeAction = (
  action: ActionBase,
  resolveRoute: (route: string) => string,
): ActionBase => {
  switch (action.type) {
    case 'snackbar':
      return { type: 'snackbar', message: action.message || '' };
    case 'dialog':
      return {
        type: 'dialog',
        title: action.title || '',
        message: action.message || '',
      };
    case 'navigate':
      return { type: 'navigate', route: resolveRoute(action.route || '/') };
    case 'goBack':
      return { type: 'goBack' };
  }
};

const mapWidgetNavigationRoutes = (
  widget: FlutterWidget,
  resolveRoute: (route: string) => string,
): FlutterWidget => {
  const children = widget.children?.map((child) => mapWidgetNavigationRoutes(child, resolveRoute));
  const itemTemplate = widget.itemTemplate
    ? mapWidgetNavigationRoutes(widget.itemTemplate, resolveRoute)
    : undefined;

  if (widget.type === 'Button') {
    return {
      ...widget,
      props: {
        ...widget.props,
        actions: (widget.props.actions || []).map((action) =>
          normalizeAction(action, resolveRoute),
        ),
      },
      children,
      itemTemplate,
    };
  }

  if (widget.type === 'ListTile') {
    return {
      ...widget,
      props: {
        ...widget.props,
        actions: {
          type: 'navigate',
          route: resolveRoute(widget.props.actions?.route || '/'),
        },
      },
      children,
      itemTemplate,
    };
  }

  if (widget.type === 'BottomNavigationBar') {
    return {
      ...widget,
      props: {
        ...widget.props,
        items: (widget.props.items || []).map((item) => ({
          ...item,
          route: resolveRoute(item.route || '/'),
        })),
      },
      children,
      itemTemplate,
    };
  }

  return { ...widget, children, itemTemplate } as FlutterWidget;
};

const mapScreenNavigationRoutes = (
  screens: Screen[],
  resolveRoute: (route: string) => string,
): Screen[] =>
  screens.map((screen) => ({
    ...screen,
    components: screen.components.map((widget) => mapWidgetNavigationRoutes(widget, resolveRoute)),
  }));

const remapScreenNavigationRoutes = (
  screens: Screen[],
  previousRoute: string,
  nextRoute: string,
): Screen[] =>
  mapScreenNavigationRoutes(screens, (route) => (route === previousRoute ? nextRoute : route));

const ensureValidScreenNavigationRoutes = (screens: Screen[]): Screen[] => {
  const validRoutes = new Set(screens.map((screen) => screen.route));
  const fallbackRoute = screens.find((screen) => screen.is_home)?.route ?? screens[0]?.route ?? '/';

  return mapScreenNavigationRoutes(screens, (route) =>
    validRoutes.has(route) ? route : fallbackRoute,
  );
};

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

const getScreenRoute = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `/${slug || 'screen'}`;
};

const getUniqueScreenRoute = (
  name: string,
  screens: Screen[],
  excludedScreenId?: string,
): string => {
  const baseRoute = getScreenRoute(name);
  const usedRoutes = new Set(
    screens.filter((screen) => screen.id !== excludedScreenId).map((screen) => screen.route),
  );

  if (!usedRoutes.has(baseRoute)) return baseRoute;

  let suffix = 2;
  while (usedRoutes.has(`${baseRoute}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseRoute}-${suffix}`;
};

const exportProject = (project: Project): Project => {
  const linkedScreens = ensureValidScreenNavigationRoutes(project.screens);

  return {
    app_name: project.app_name,
    package_name: project.package_name,
    screens: linkedScreens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      route: screen.route,
      is_home: screen.is_home,
      components: normalizeWidgetsForExport(screen.components),
    })),
  };
};

export {
  applyDefaultsToWidgets,
  ensureValidScreenNavigationRoutes,
  exportProject,
  getScreenRoute,
  getUniqueScreenRoute,
  normalizeScreens,
  normalizeWidgetsForExport,
  remapScreenNavigationRoutes,
};
