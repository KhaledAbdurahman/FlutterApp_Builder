import type { IProject, IProjectId, IProjectJsonData } from '@/types/api/project-types';
import type { IBuilderState } from '@/types/builder-slice-types';
import type { FlutterWidget, Project, Screen, WidgetProps, WidgetType } from '@/types/screen-types';

interface IBuilderStoreActions {
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
  importProjectData: (data: IProjectJsonData) => void;
  moveWidget: (widgetId: string, newParentId: string | null, index?: number) => void;
  setScreenComponents: (components: FlutterWidget[]) => void;
  getActiveScreen: () => Screen | undefined;
  getWidgetById: (widgetId: string) => FlutterWidget | undefined;
  setProjectName: (name: string) => void;
  setProjectTitle: (name: string) => void;
  setPackageName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  exportProject: () => Project;
  loadProject: (savedProject: IProject) => void;
  setServerProjectId: (id: IProjectId | null) => void;
}

interface IBuilderStore extends IBuilderState, IBuilderStoreActions {}

export type { IBuilderStore };
