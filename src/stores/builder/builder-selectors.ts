import { findWidgetById } from '@/stores/builder/builder-tree-utils';
import type { IBuilderState } from '@/types/builder-slice-types';
import type { FlutterWidget, Screen } from '@/types/screen-types';

interface IBuilderRootState {
  builder: IBuilderState;
}

const selectBuilderState = (state: IBuilderRootState): IBuilderState => state.builder;

const selectActiveScreen = (state: IBuilderRootState): Screen | undefined =>
  state.builder.project.screens.find((screen) => screen.id === state.builder.activeScreenId);

const selectWidgetById = (
  state: IBuilderRootState,
  widgetId: string,
): FlutterWidget | undefined => {
  const activeScreen = selectActiveScreen(state);
  return activeScreen ? findWidgetById(activeScreen.components, widgetId) : undefined;
};

export { selectActiveScreen, selectBuilderState, selectWidgetById };
