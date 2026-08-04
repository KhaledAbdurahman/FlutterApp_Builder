import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { getChildSlots } from '@/lib/widgetTreeUtils';
import {
  IMPORT_FALLBACK_APP_NAME,
  IMPORT_FALLBACK_PACKAGE_NAME,
  createInitialProject,
} from '@/stores/builder/builder-defaults';
import {
  addWidgetToParent,
  findAndUpdateWidget,
  findWidgetById,
  removeWidgetById,
} from '@/stores/builder/builder-tree-utils';
import {
  applyDefaultsToWidgets,
  getUniqueScreenRoute,
  normalizeScreens,
  remapScreenNavigationRoutes,
} from '@/stores/builder/builder-project-utils';
import type { IProject, IProjectId, IProjectJsonData } from '@/types/api/project-types';
import type {
  IAddWidgetPayload,
  IBuilderState,
  IMoveWidgetPayload,
  IRenameScreenPayload,
  IUpdateWidgetPayload,
  IUpdateWidgetPropsPayload,
} from '@/types/builder-slice-types';
import type { FlutterWidget, Screen, WidgetProps } from '@/types/screen-types';
import { getWidgetDefinition, resolveWidgetProps } from '@/types/screen-types';

const initialProjectData = createInitialProject();
const initialProject = {
  ...initialProjectData,
  screens: normalizeScreens(initialProjectData.screens),
};

const updateActiveScreenComponents = (
  state: IBuilderState,
  getComponents: (screen: Screen) => FlutterWidget[],
) => ({
  ...state,
  project: {
    ...state.project,
    screens: state.project.screens.map((screen) =>
      screen.id === state.activeScreenId
        ? { ...screen, components: getComponents(screen) }
        : screen,
    ),
  },
});

const initialState: IBuilderState = {
  project: initialProject,
  projectTitle: initialProject.app_name,
  projectDescription: '',
  activeScreenId: initialProject.screens[0].id,
  selectedWidgetId: null,
  isDragging: false,
  serverProjectId: null,
};

// Builder actions share one state boundary so each editor change remains an atomic Redux transition.
const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    setActiveScreen(state, action: PayloadAction<string>) {
      state.activeScreenId = action.payload;
      state.selectedWidgetId = null;
    },
    setSelectedWidget(state, action: PayloadAction<string | null>) {
      state.selectedWidgetId = action.payload;
    },
    setIsDragging(state, action: PayloadAction<boolean>) {
      state.isDragging = action.payload;
    },
    setServerProjectId(state, action: PayloadAction<IProjectId | null>) {
      state.serverProjectId = action.payload;
    },
    importProjectData(state, action: PayloadAction<IProjectJsonData>) {
      const data = action.payload;
      const normalizedScreens = normalizeScreens(data.screens);

      return {
        ...state,
        project: {
          app_name: data.app_name || IMPORT_FALLBACK_APP_NAME,
          package_name: data.package_name || IMPORT_FALLBACK_PACKAGE_NAME,
          screens: normalizedScreens,
        },
        projectTitle: data.app_name || IMPORT_FALLBACK_APP_NAME,
        activeScreenId: normalizedScreens[0].id,
        selectedWidgetId: null,
        serverProjectId: null,
      };
    },
    loadProject(state, action: PayloadAction<IProject>) {
      const savedProject = action.payload;
      const jsonData = savedProject.json_data;
      const normalizedScreens = normalizeScreens(jsonData.screens);

      return {
        ...state,
        project: {
          app_name: jsonData.app_name || savedProject.name,
          package_name: jsonData.package_name || IMPORT_FALLBACK_PACKAGE_NAME,
          screens: normalizedScreens,
        },
        projectTitle: savedProject.name || jsonData.app_name,
        projectDescription: savedProject.description || '',
        activeScreenId: normalizedScreens[0].id,
        selectedWidgetId: null,
        serverProjectId: savedProject.id,
      };
    },
    addScreen(state, action: PayloadAction<string>) {
      const name = action.payload;
      const newScreen: Screen = {
        id: uuidv4(),
        name,
        route: getUniqueScreenRoute(name, state.project.screens),
        is_home: false,
        components: [],
      };

      state.project.screens.push(newScreen);
      state.activeScreenId = newScreen.id;
      state.selectedWidgetId = null;
    },
    deleteScreen(state, action: PayloadAction<string>) {
      const deletedScreen = state.project.screens.find((screen) => screen.id === action.payload);
      if (!deletedScreen || deletedScreen.is_home) return;

      const screens = state.project.screens.filter((screen) => screen.id !== action.payload);
      const nextScreens = screens.length > 0 ? screens : normalizeScreens([]);
      const fallbackScreen = nextScreens.find((screen) => screen.is_home) ?? nextScreens[0];

      state.project.screens = remapScreenNavigationRoutes(
        nextScreens,
        deletedScreen.route,
        fallbackScreen.route,
      );
      state.activeScreenId =
        state.activeScreenId === deletedScreen.id ? fallbackScreen.id : state.activeScreenId;
      state.selectedWidgetId = null;
    },
    renameScreen(state, action: PayloadAction<IRenameScreenPayload>) {
      const { screenId, newName } = action.payload;
      const renamedScreen = state.project.screens.find((screen) => screen.id === screenId);
      if (!renamedScreen) return;

      const nextRoute = renamedScreen.is_home
        ? renamedScreen.route
        : getUniqueScreenRoute(newName, state.project.screens, screenId);
      const renamedScreens = state.project.screens.map((screen) =>
        screen.id === screenId
          ? {
              ...screen,
              name: newName,
              route: nextRoute,
            }
          : screen,
      );

      state.project.screens = remapScreenNavigationRoutes(
        renamedScreens,
        renamedScreen.route,
        nextRoute,
      );
    },
    addWidget(state, action: PayloadAction<IAddWidgetPayload>) {
      const { type, parentId } = action.payload;
      const definition = getWidgetDefinition(type);
      const childMode = definition?.childConfig.mode;
      const childSlots = getChildSlots(type);
      const hasChildrenSlot = childSlots.some((slot) => slot.key === 'children');
      const newWidget = {
        id: uuidv4(),
        type,
        props: resolveWidgetProps(type, definition?.defaultProps),
        children: childMode && childMode !== 'none' && hasChildrenSlot ? [] : undefined,
      } as FlutterWidget;

      if (type === 'Drawer') {
        newWidget.children = [
          {
            id: uuidv4(),
            type: 'Column',
            props: resolveWidgetProps('Column', undefined),
            children: [],
          } as FlutterWidget,
        ];
      }

      const screen = state.project.screens.find((item) => item.id === state.activeScreenId);
      if (!screen) return;

      const components = parentId
        ? addWidgetToParent(screen.components, parentId, newWidget)
        : [...screen.components, newWidget];

      return {
        ...updateActiveScreenComponents(state, () => components),
        selectedWidgetId: newWidget.id,
      };
    },
    updateWidget(state, action: PayloadAction<IUpdateWidgetPayload>) {
      const { widgetId, updates } = action.payload;
      const screen = state.project.screens.find((item) => item.id === state.activeScreenId);
      if (!screen) return;

      const components = findAndUpdateWidget(
        screen.components,
        widgetId,
        (widget) =>
          ({
            ...widget,
            ...updates,
          }) as FlutterWidget,
      );

      return updateActiveScreenComponents(state, () => components);
    },
    updateWidgetProps(state, action: PayloadAction<IUpdateWidgetPropsPayload>) {
      const { widgetId, props } = action.payload;
      const screen = state.project.screens.find((item) => item.id === state.activeScreenId);
      if (!screen) return;

      const components = findAndUpdateWidget(screen.components, widgetId, (widget) => ({
        ...widget,
        props: { ...widget.props, ...(props as WidgetProps) },
      }));

      return updateActiveScreenComponents(state, () => components);
    },
    deleteWidget(state, action: PayloadAction<string>) {
      const widgetId = action.payload;
      const screen = state.project.screens.find((item) => item.id === state.activeScreenId);
      if (!screen) return;

      return {
        ...updateActiveScreenComponents(state, (item) =>
          removeWidgetById(item.components, widgetId),
        ),
        selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
      };
    },
    moveWidget(state, action: PayloadAction<IMoveWidgetPayload>) {
      const { widgetId, newParentId, index } = action.payload;
      const screen = state.project.screens.find((item) => item.id === state.activeScreenId);
      if (!screen) return;

      const widget = findWidgetById(screen.components, widgetId);
      if (!widget) return;

      let components = removeWidgetById(screen.components, widgetId);

      if (newParentId) {
        components = addWidgetToParent(components, newParentId, widget, index);
      } else if (index !== undefined) {
        components = [...components.slice(0, index), widget, ...components.slice(index)];
      } else {
        components = [...components, widget];
      }

      return updateActiveScreenComponents(state, () => components);
    },
    setScreenComponents(state, action: PayloadAction<FlutterWidget[]>) {
      const components = applyDefaultsToWidgets(action.payload);
      return updateActiveScreenComponents(state, () => components);
    },
    setProjectName(state, action: PayloadAction<string>) {
      state.project.app_name = action.payload;
    },
    setProjectTitle(state, action: PayloadAction<string>) {
      state.projectTitle = action.payload;
    },
    setPackageName(state, action: PayloadAction<string>) {
      state.project.package_name = action.payload;
    },
    setProjectDescription(state, action: PayloadAction<string>) {
      state.projectDescription = action.payload;
    },
  },
});

const builderActions = builderSlice.actions;
const builderReducer = builderSlice.reducer;

export { builderActions, builderReducer };
