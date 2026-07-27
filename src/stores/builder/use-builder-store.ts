import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/config/redux/store';
import type { IAddWidgetPayload, IMoveWidgetPayload } from '@/types/builder-slice-types';
import type { IBuilderStore } from '@/types/use-builder-store-types';
import { builderActions } from '@/stores/builder/builder-slice';
import { selectActiveScreen, selectBuilderState } from '@/stores/builder/builder-selectors';
import { findWidgetById } from '@/stores/builder/builder-tree-utils';
import { exportProject } from '@/stores/builder/builder-project-utils';
import type { FlutterWidget, WidgetProps, WidgetType } from '@/types/screen-types';
import type { IProject, IProjectId, IProjectJsonData } from '@/types/api/project-types';

const getAddWidgetPayload = (type: WidgetType, parentId?: string): IAddWidgetPayload =>
  parentId ? { type, parentId } : { type };

const getMoveWidgetPayload = (
  widgetId: string,
  newParentId: string | null,
  index?: number,
): IMoveWidgetPayload =>
  index !== undefined ? { widgetId, newParentId, index } : { widgetId, newParentId };

// This facade preserves the builder component API while Redux owns the state implementation.
const useBuilderStore = (): IBuilderStore => {
  const dispatch = useAppDispatch();
  const builderState = useAppSelector(selectBuilderState);
  const activeScreen = useAppSelector(selectActiveScreen);

  const getWidgetById = useCallback(
    (widgetId: string): FlutterWidget | undefined => {
      if (!activeScreen) return undefined;

      return findWidgetById(activeScreen.components, widgetId);
    },
    [activeScreen],
  );

  return useMemo(
    () => ({
      ...builderState,
      setActiveScreen: (screenId: string) => dispatch(builderActions.setActiveScreen(screenId)),
      setSelectedWidget: (widgetId: string | null) =>
        dispatch(builderActions.setSelectedWidget(widgetId)),
      setIsDragging: (isDragging: boolean) => dispatch(builderActions.setIsDragging(isDragging)),
      addScreen: (name: string) => dispatch(builderActions.addScreen(name)),
      deleteScreen: (screenId: string) => dispatch(builderActions.deleteScreen(screenId)),
      renameScreen: (screenId: string, newName: string) =>
        dispatch(builderActions.renameScreen({ screenId, newName })),
      addWidget: (type: WidgetType, parentId?: string) =>
        dispatch(builderActions.addWidget(getAddWidgetPayload(type, parentId))),
      updateWidget: (widgetId: string, updates: Partial<FlutterWidget>) =>
        dispatch(builderActions.updateWidget({ widgetId, updates })),
      updateWidgetProps: (widgetId: string, props: Partial<WidgetProps>) =>
        dispatch(builderActions.updateWidgetProps({ widgetId, props })),
      deleteWidget: (widgetId: string) => dispatch(builderActions.deleteWidget(widgetId)),
      importProjectData: (data: IProjectJsonData) =>
        dispatch(builderActions.importProjectData(data)),
      moveWidget: (widgetId: string, newParentId: string | null, index?: number) =>
        dispatch(builderActions.moveWidget(getMoveWidgetPayload(widgetId, newParentId, index))),
      setScreenComponents: (components: FlutterWidget[]) =>
        dispatch(builderActions.setScreenComponents(components)),
      getActiveScreen: () => activeScreen,
      getWidgetById,
      setProjectName: (name: string) => dispatch(builderActions.setProjectName(name)),
      setProjectTitle: (name: string) => dispatch(builderActions.setProjectTitle(name)),
      setPackageName: (name: string) => dispatch(builderActions.setPackageName(name)),
      setProjectDescription: (description: string) =>
        dispatch(builderActions.setProjectDescription(description)),
      exportProject: () => exportProject(builderState.project),
      loadProject: (savedProject: IProject) => dispatch(builderActions.loadProject(savedProject)),
      setServerProjectId: (id: IProjectId | null) =>
        dispatch(builderActions.setServerProjectId(id)),
    }),
    [activeScreen, builderState, dispatch, getWidgetById],
  );
};

export { useBuilderStore };
