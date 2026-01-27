import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  FlutterWidget,
  Screen,
  Project,
  WidgetType,
  WidgetProps,
  getWidgetDefinition,
  resolveWidgetProps,
} from "@/types/screen-types";
import { SavedProject, ProjectJsonData } from "@/lib/api";

interface BuilderState {
  project: Project;
  projectTitle: string;
  projectDescription: string;
  activeScreenId: string;
  selectedWidgetId: string | null;
  isDragging: boolean;
  serverProjectId: number | null;

  // Actions
  setActiveScreen: (screenId: string) => void;
  setSelectedWidget: (widgetId: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  addScreen: (name: string) => void;
  deleteScreen: (screenId: string) => void;
  renameScreen: (screenId: string, newName: string) => void;
  addWidget: (type: WidgetType, parentId?: string) => void;
  updateWidget: (widgetId: string, updates: Partial<FlutterWidget>) => void;
  updateWidgetProps: (widgetId: string, props: Partial<WidgetProps>) => void;
  deleteWidget: (widgetId: string) => void;
  importProjectData: (data: ProjectJsonData) => void;
  moveWidget: (
    widgetId: string,
    newParentId: string | null,
    index?: number,
  ) => void;
  setScreenComponents: (components: FlutterWidget[]) => void;
  getActiveScreen: () => Screen | undefined;
  getWidgetById: (widgetId: string) => FlutterWidget | undefined;
  setProjectName: (name: string) => void;
  setProjectTitle: (name: string) => void;
  setPackageName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  exportProject: () => Project;
  loadProject: (savedProject: SavedProject) => void;
  setServerProjectId: (id: number | null) => void;
}

const applyDefaultsToWidget = (widget: FlutterWidget): FlutterWidget =>
  ({
    ...widget,
    props: resolveWidgetProps(widget.type, widget.props),
    children: widget.children?.map(applyDefaultsToWidget),
    itemTemplate:
      widget.type === "ListView" && widget.itemTemplate
        ? applyDefaultsToWidget(widget.itemTemplate)
        : widget.itemTemplate,
  }) as FlutterWidget;

const applyDefaultsToWidgets = (widgets: FlutterWidget[]) =>
  widgets.map(applyDefaultsToWidget);

const normalizeContainerLayoutValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === "auto") return 0;
  return 0;
};

const normalizeWidgetsForExport = (widgets: FlutterWidget[]): FlutterWidget[] =>
  widgets.map((widget) => {
    const children = widget.children
      ? normalizeWidgetsForExport(widget.children)
      : undefined;

    if (widget.type !== "Container") {
      const itemTemplate =
        widget.type === "ListView" && widget.itemTemplate
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
      !normalizedLayout ||
      (normalizedLayout.w === 0 && normalizedLayout.h === 0);
    const { layout: _layout, ...restProps } = widget.props;

    return {
      ...widget,
      props: shouldOmitLayout
        ? restProps
        : { ...restProps, layout: normalizedLayout },
      children,
    } as FlutterWidget;
  });

const createDefaultScreen = (): Screen => ({
  id: uuidv4(),
  name: "Home",
  route: "/",
  is_home: true,
  components: applyDefaultsToWidgets([
    {
      id: uuidv4(),
      type: "Scaffold",
      props: { backgroundColor: "#FFFFFF" },
      children: [
        {
          id: uuidv4(),
          type: "AppBar",
          props: { title: "My App", backgroundColor: "#3B82F6" },
        },
        {
          id: uuidv4(),
          type: "Center",
          props: {},
          children: [
            {
              id: uuidv4(),
              type: "Column",
              props: { mainAxisAlignment: "center" },
              children: [
                {
                  id: uuidv4(),
                  type: "Text",
                  props: {
                    text: "Welcome to Flutter Builder!",
                    fontSize: 24,
                    fontWeight: "bold",
                  },
                },
                {
                  id: uuidv4(),
                  type: "SizedBox",
                  props: { height: 20 },
                },
                {
                  id: uuidv4(),
                  type: "Button",
                  props: { text: "Get Started" },
                },
              ],
            },
          ],
        },
      ],
    },
  ]),
});

const initialProject: Project = {
  app_name: "my_flutter_app",
  package_name: "com.example.myapp",
  screens: [createDefaultScreen()],
};

const findWidgetById = (
  widgets: FlutterWidget[],
  id: string,
): FlutterWidget | undefined => {
  for (const widget of widgets) {
    if (widget.id === id) return widget;
    if (widget.children) {
      const found = findWidgetById(widget.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

const findAndUpdateWidget = (
  widgets: FlutterWidget[],
  id: string,
  updater: (widget: FlutterWidget) => FlutterWidget,
): FlutterWidget[] => {
  return widgets.map((widget) => {
    if (widget.id === id) {
      return updater(widget);
    }
    if (widget.children) {
      return {
        ...widget,
        children: findAndUpdateWidget(widget.children, id, updater),
      };
    }
    return widget;
  });
};

const removeWidgetById = (
  widgets: FlutterWidget[],
  id: string,
): FlutterWidget[] => {
  return widgets
    .filter((widget) => widget.id !== id)
    .map((widget) => ({
      ...widget,
      children: widget.children
        ? removeWidgetById(widget.children, id)
        : undefined,
    }));
};

const addWidgetToParent = (
  widgets: FlutterWidget[],
  parentId: string,
  newWidget: FlutterWidget,
  index?: number,
): FlutterWidget[] => {
  return widgets.map((widget) => {
    if (widget.id === parentId) {
      const children = widget.children || [];
      const newChildren =
        index !== undefined
          ? [...children.slice(0, index), newWidget, ...children.slice(index)]
          : [...children, newWidget];
      return { ...widget, children: newChildren };
    }
    if (widget.children) {
      return {
        ...widget,
        children: addWidgetToParent(
          widget.children,
          parentId,
          newWidget,
          index,
        ),
      };
    }
    return widget;
  });
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  project: initialProject,
  projectTitle: initialProject.app_name,
  projectDescription: "",
  activeScreenId: initialProject.screens[0].id,
  selectedWidgetId: null,
  isDragging: false,
  serverProjectId: null,

  setActiveScreen: (screenId) =>
    set({ activeScreenId: screenId, selectedWidgetId: null }),

  setSelectedWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  setIsDragging: (isDragging) => set({ isDragging }),

  setServerProjectId: (id) => set({ serverProjectId: id }),

  importProjectData: (data) => {
    const screens = (data.screens as Screen[]) || [];
    const finalScreens = screens.length > 0 ? screens : [createDefaultScreen()];
    const normalizedScreens = finalScreens.map((screen) => ({
      ...screen,
      components: applyDefaultsToWidgets(screen.components || []),
    }));

    set({
      project: {
        app_name: data.app_name || "My App",
        package_name: data.package_name || "com.example.app",
        screens: normalizedScreens,
      },
      projectTitle: data.app_name || "My App",
      activeScreenId: normalizedScreens[0].id,
      selectedWidgetId: null,
      serverProjectId: null,
    });
  },

  loadProject: (savedProject) => {
    const jsonData = savedProject.json_data;
    const screens = (jsonData.screens as Screen[]) || [];

    // Ensure we have at least one screen
    const finalScreens = screens.length > 0 ? screens : [createDefaultScreen()];
    const normalizedScreens = finalScreens.map((screen) => ({
      ...screen,
      components: applyDefaultsToWidgets(screen.components || []),
    }));

    set({
      project: {
        app_name: jsonData.app_name || savedProject.name,
        package_name: jsonData.package_name || "com.example.app",
        screens: normalizedScreens,
      },
      projectTitle: savedProject.name || jsonData.app_name,
      projectDescription: savedProject.description || "",
      activeScreenId: normalizedScreens[0].id,
      selectedWidgetId: null,
      serverProjectId: savedProject.id,
    });
  },

  addScreen: (name) => {
    const newScreen: Screen = {
      id: uuidv4(),
      name,
      route: `/${name.toLowerCase().replace(/\s+/g, "-")}`,
      is_home: false,
      components: [],
    };
    set((state) => ({
      project: {
        ...state.project,
        screens: [...state.project.screens, newScreen],
      },
      activeScreenId: newScreen.id,
    }));
  },

  deleteScreen: (screenId) => {
    set((state) => {
      const screens = state.project.screens.filter((s) => s.id !== screenId);
      if (screens.length === 0) {
        screens.push(createDefaultScreen());
      }
      return {
        project: { ...state.project, screens },
        activeScreenId: screens[0].id,
        selectedWidgetId: null,
      };
    });
  },

  renameScreen: (screenId, newName) => {
    set((state) => ({
      project: {
        ...state.project,
        screens: state.project.screens.map((s) =>
          s.id === screenId
            ? {
                ...s,
                name: newName,
                route: `/${newName.toLowerCase().replace(/\s+/g, "-")}`,
              }
            : s,
        ),
      },
    }));
  },

  addWidget: (type, parentId) => {
    const definition = getWidgetDefinition(type);
    const childMode = definition?.childConfig.mode;
    const newWidget = {
      id: uuidv4(),
      type,
      props: resolveWidgetProps(type, definition?.defaultProps),
      children: childMode && childMode !== "none" ? [] : undefined,
    } as FlutterWidget;

    if (type === "Drawer") {
      newWidget.children = [
        {
          id: uuidv4(),
          type: "Column",
          props: resolveWidgetProps("Column", undefined as any),
          children: [],
        } as FlutterWidget,
      ];
    }

    set((state) => {
      const screen = state.project.screens.find(
        (s) => s.id === state.activeScreenId,
      );
      if (!screen) return state;

      let newComponents: FlutterWidget[];
      if (parentId) {
        newComponents = addWidgetToParent(
          screen.components,
          parentId,
          newWidget,
        );
      } else {
        newComponents = [...screen.components, newWidget];
      }

      return {
        project: {
          ...state.project,
          screens: state.project.screens.map((s) =>
            s.id === state.activeScreenId
              ? { ...s, components: newComponents }
              : s,
          ),
        },
        selectedWidgetId: newWidget.id,
      };
    });
  },

  updateWidget: (widgetId, updates) => {
    set((state) => {
      const screen = state.project.screens.find(
        (s) => s.id === state.activeScreenId,
      );
      if (!screen) return state;

      const newComponents = findAndUpdateWidget(
        screen.components,
        widgetId,
        (widget) =>
          ({
            ...widget,
            ...updates,
          }) as FlutterWidget,
      );

      return {
        project: {
          ...state.project,
          screens: state.project.screens.map((s) =>
            s.id === state.activeScreenId
              ? { ...s, components: newComponents }
              : s,
          ),
        },
      };
    });
  },

  updateWidgetProps: (widgetId, props) => {
    set((state) => {
      const screen = state.project.screens.find(
        (s) => s.id === state.activeScreenId,
      );
      if (!screen) return state;

      const newComponents = findAndUpdateWidget(
        screen.components,
        widgetId,
        (widget) => ({
          ...widget,
          props: { ...widget.props, ...props },
        }),
      );

      return {
        project: {
          ...state.project,
          screens: state.project.screens.map((s) =>
            s.id === state.activeScreenId
              ? { ...s, components: newComponents }
              : s,
          ),
        },
      };
    });
  },

  deleteWidget: (widgetId) => {
    set((state) => {
      const screen = state.project.screens.find(
        (s) => s.id === state.activeScreenId,
      );
      if (!screen) return state;

      return {
        project: {
          ...state.project,
          screens: state.project.screens.map((s) =>
            s.id === state.activeScreenId
              ? { ...s, components: removeWidgetById(s.components, widgetId) }
              : s,
          ),
        },
        selectedWidgetId:
          state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
      };
    });
  },

  moveWidget: (widgetId, newParentId, index) => {
    set((state) => {
      const screen = state.project.screens.find(
        (s) => s.id === state.activeScreenId,
      );
      if (!screen) return state;

      const widget = findWidgetById(screen.components, widgetId);
      if (!widget) return state;

      let newComponents = removeWidgetById(screen.components, widgetId);

      if (newParentId) {
        newComponents = addWidgetToParent(
          newComponents,
          newParentId,
          widget,
          index,
        );
      } else {
        if (index !== undefined) {
          newComponents = [
            ...newComponents.slice(0, index),
            widget,
            ...newComponents.slice(index),
          ];
        } else {
          newComponents = [...newComponents, widget];
        }
      }

      return {
        project: {
          ...state.project,
          screens: state.project.screens.map((s) =>
            s.id === state.activeScreenId
              ? { ...s, components: newComponents }
              : s,
          ),
        },
      };
    });
  },

  setScreenComponents: (components) => {
    set((state) => ({
      project: {
        ...state.project,
        screens: state.project.screens.map((s) =>
          s.id === state.activeScreenId
            ? { ...s, components: applyDefaultsToWidgets(components) }
            : s,
        ),
      },
    }));
  },

  getActiveScreen: () => {
    const state = get();
    return state.project.screens.find((s) => s.id === state.activeScreenId);
  },

  getWidgetById: (widgetId) => {
    const screen = get().getActiveScreen();
    if (!screen) return undefined;
    return findWidgetById(screen.components, widgetId);
  },

  setProjectName: (name) =>
    set((state) => ({
      project: { ...state.project, app_name: name },
    })),

  setProjectTitle: (name) => set({ projectTitle: name }),

  setPackageName: (name) =>
    set((state) => ({
      project: { ...state.project, package_name: name },
    })),

  setProjectDescription: (description) =>
    set({ projectDescription: description }),

  exportProject: () => {
    const state = get();
    return {
      app_name: state.project.app_name,
      package_name: state.project.package_name,
      screens: state.project.screens.map((screen) => ({
        id: screen.id,
        name: screen.name,
        route: screen.route,
        is_home: screen.is_home,
        components: normalizeWidgetsForExport(screen.components),
      })),
    };
  },
}));
