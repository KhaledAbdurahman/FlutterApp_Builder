import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  FlutterWidget,
  Screen,
  Project,
  WidgetType,
  WidgetProps,
  getWidgetDefinition,
} from "@/types/flutter";
import { SavedProject, ProjectJsonData } from "@/lib/api";

interface BuilderState {
  project: Project;
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
  moveWidget: (
    widgetId: string,
    newParentId: string | null,
    index?: number,
  ) => void;
  setScreenComponents: (components: FlutterWidget[]) => void;
  getActiveScreen: () => Screen | undefined;
  getWidgetById: (widgetId: string) => FlutterWidget | undefined;
  setProjectName: (name: string) => void;
  setPackageName: (name: string) => void;
  exportProject: () => Project;
  loadProject: (savedProject: SavedProject) => void;
  setServerProjectId: (id: number | null) => void;
}

const createDefaultScreen = (): Screen => ({
  id: uuidv4(),
  name: "Home",
  route: "/",
  is_home: true,
  components: [
    {
      id: uuidv4(),
      type: "Scaffold",
      props: {},
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
  ],
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
  activeScreenId: initialProject.screens[0].id,
  selectedWidgetId: null,
  isDragging: false,
  serverProjectId: null,

  setActiveScreen: (screenId) =>
    set({ activeScreenId: screenId, selectedWidgetId: null }),

  setSelectedWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  setIsDragging: (isDragging) => set({ isDragging }),

  setServerProjectId: (id) => set({ serverProjectId: id }),

  loadProject: (savedProject) => {
    const jsonData = savedProject.json_data;
    const screens = (jsonData.screens as Screen[]) || [];

    // Ensure we have at least one screen
    const finalScreens = screens.length > 0 ? screens : [createDefaultScreen()];

    set({
      project: {
        app_name: jsonData.app_name || savedProject.name,
        package_name: jsonData.package_name || "com.example.app",
        screens: finalScreens,
      },
      activeScreenId: finalScreens[0].id,
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
    const newWidget: FlutterWidget = {
      id: uuidv4(),
      type,
      props: { ...definition?.defaultProps },
      children: definition?.canHaveChildren ? [] : undefined,
    };

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
        (widget) => ({
          ...widget,
          ...updates,
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
          s.id === state.activeScreenId ? { ...s, components } : s,
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

  setPackageName: (name) =>
    set((state) => ({
      project: { ...state.project, package_name: name },
    })),

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
        components: screen.components,
      })),
    };
  },
}));
