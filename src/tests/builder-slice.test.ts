import { describe, it, expect } from 'vitest';
import { builderActions, builderReducer } from '@/stores/builder/builder-slice';
import { exportProject, getScreenRoute } from '@/stores/builder/builder-project-utils';
import type { IBuilderState } from '@/types/builder-slice-types';
import type { ActionBase, FlutterWidget, Screen } from '@/types/screen-types';

const CreateNavigationWidgets = (route: string): FlutterWidget[] => [
  {
    id: 'button',
    type: 'Button',
    props: {
      actions: [{ type: 'navigate', route }],
    },
  },
  {
    id: 'bottom-navigation',
    type: 'BottomNavigationBar',
    props: {
      items: [{ label: 'Details', icon: 'info', route }],
    },
  },
  {
    id: 'list-tile',
    type: 'ListTile',
    props: {
      title: 'Details',
      actions: { type: 'navigate', route },
    },
  },
];

const CreateBuilderState = (): IBuilderState => {
  const screens: Screen[] = [
    {
      id: 'home',
      name: 'Home',
      route: '/',
      is_home: true,
      components: CreateNavigationWidgets('/details'),
    },
    {
      id: 'details',
      name: 'Details',
      route: '/details',
      is_home: false,
      components: [],
    },
  ];

  return {
    project: {
      app_name: 'test_app',
      package_name: 'com.example.test',
      screens,
    },
    projectTitle: 'Test App',
    projectDescription: '',
    activeScreenId: 'home',
    selectedWidgetId: 'button',
    isDragging: false,
    serverProjectId: null,
  };
};

const GetNavigationRoutes = (screen: Screen): string[] =>
  screen.components.flatMap((widget) => {
    if (widget.type === 'Button') {
      return widget.props.actions
        ?.filter((action) => action.type === 'navigate')
        .map((action) => action.route);
    }
    if (widget.type === 'BottomNavigationBar') {
      return widget.props.items?.map((item) => item.route);
    }
    if (widget.type === 'ListTile') {
      return [widget.props.actions?.route];
    }
    return [];
  });

describe('builder screen routes', () => {
  it('creates sanitized, unique routes and clears stale widget selection', () => {
    const firstState = builderReducer(CreateBuilderState(), builderActions.addScreen('Checkout'));
    const secondState = builderReducer(firstState, builderActions.addScreen('Checkout'));

    expect(firstState.project.screens.at(-1)?.route).toBe('/checkout');
    expect(secondState.project.screens.at(-1)?.route).toBe('/checkout-2');
    expect(secondState.selectedWidgetId).toBeNull();
    expect(getScreenRoute('  Order & Payment  ')).toBe('/order-payment');
  });

  it('updates every navigation reference when a screen route changes', () => {
    const state = builderReducer(
      CreateBuilderState(),
      builderActions.renameScreen({ screenId: 'details', newName: 'User Profile' }),
    );

    expect(state.project.screens.find((screen) => screen.id === 'details')?.route).toBe(
      '/user-profile',
    );
    expect(GetNavigationRoutes(state.project.screens[0])).toEqual([
      '/user-profile',
      '/user-profile',
      '/user-profile',
    ]);
  });

  it('redirects references to the home route when a screen is deleted', () => {
    const state = builderReducer(CreateBuilderState(), builderActions.deleteScreen('details'));

    expect(state.project.screens.map((screen) => screen.id)).toEqual(['home']);
    expect(GetNavigationRoutes(state.project.screens[0])).toEqual(['/', '/', '/']);
  });

  it('exports exact action shapes and repairs missing routes', () => {
    const state = CreateBuilderState();
    const button = state.project.screens[0].components[0];

    if (button.type !== 'Button') throw new Error('Expected a Button test fixture');

    button.props.actions = [
      {
        type: 'navigate',
        route: '/missing',
        message: 'stale snackbar field',
      } as unknown as ActionBase,
    ];

    const exportedButton = exportProject(state.project).screens[0].components[0];
    if (exportedButton.type !== 'Button') throw new Error('Expected an exported Button');

    expect(exportedButton.props.actions).toEqual([{ type: 'navigate', route: '/' }]);
  });
});
