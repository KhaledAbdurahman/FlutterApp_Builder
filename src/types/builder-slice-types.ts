import type { IProjectId } from '@/types/api/project-types';
import type { FlutterWidget, Project, WidgetProps, WidgetType } from '@/types/screen-types';

interface IBuilderState {
  project: Project;
  projectTitle: string;
  projectDescription: string;
  activeScreenId: string;
  selectedWidgetId: string | null;
  isDragging: boolean;
  serverProjectId: IProjectId | null;
}

interface IRenameScreenPayload {
  screenId: string;
  newName: string;
}

interface IAddWidgetPayload {
  type: WidgetType;
  parentId?: string;
}

interface IUpdateWidgetPayload {
  widgetId: string;
  updates: Partial<FlutterWidget>;
}

interface IUpdateWidgetPropsPayload {
  widgetId: string;
  props: Partial<WidgetProps>;
}

interface IMoveWidgetPayload {
  widgetId: string;
  newParentId: string | null;
  index?: number;
}

export type {
  IAddWidgetPayload,
  IBuilderState,
  IMoveWidgetPayload,
  IRenameScreenPayload,
  IUpdateWidgetPayload,
  IUpdateWidgetPropsPayload,
};
