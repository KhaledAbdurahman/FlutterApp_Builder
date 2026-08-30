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
      items: [
        { label: 'Home', icon: 'home', route: '/' },
        { label: 'Details', icon: 'info', route },
      ],
    },
  },
  {
    id: 'list-tile',
    type: 'ListTile',
    props: {
      title: 'Details',
      actions: [{ type: 'navigate', route }],
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
      return widget.props.actions
        ?.filter((action) => action.type === 'navigate')
        .map((action) => action.route);
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
      '/',
      '/user-profile',
      '/user-profile',
    ]);
  });

  it('redirects references to the home route when a screen is deleted', () => {
    const state = builderReducer(CreateBuilderState(), builderActions.deleteScreen('details'));

    expect(state.project.screens.map((screen) => screen.id)).toEqual(['home']);
    expect(GetNavigationRoutes(state.project.screens[0])).toEqual(['/', '/', '/', '/']);
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

  it('exports bottom navigation items as a backend component field', () => {
    const exportedNavigation = exportProject(CreateBuilderState().project).screens[0].components[1];
    const apiNavigation = exportedNavigation as FlutterWidget & {
      items?: Array<{ label: string; icon: string; route: string }>;
    };

    expect(apiNavigation.items).toEqual([
      { label: 'Home', icon: 'home', route: '/' },
      { label: 'Details', icon: 'info', route: '/details' },
    ]);
    expect(apiNavigation.props).not.toHaveProperty('items');
  });

  it('repairs legacy bottom navigation bars before API export', () => {
    const state = CreateBuilderState();
    const navigation = state.project.screens[0].components[1];

    if (navigation.type !== 'BottomNavigationBar') {
      throw new Error('Expected a BottomNavigationBar test fixture');
    }

    navigation.props.items = [{ label: 'Home', icon: 'home', route: '/' }];
    navigation.props.currentIndex = 3;

    const exportedNavigation = exportProject(state.project).screens[0].components[1] as
      | (FlutterWidget & { items?: Array<{ label: string; icon: string; route: string }> })
      | undefined;

    expect(exportedNavigation?.items).toHaveLength(2);
    expect(exportedNavigation?.props.currentIndex).toBe(1);
  });

  it('applies imported screens without replacing the current project identity', () => {
    const currentState = {
      ...CreateBuilderState(),
      serverProjectId: 42,
      projectDescription: 'Keep this description',
    };
    const importedScreen: Screen = {
      id: 'imported',
      name: 'Imported',
      route: '/imported',
      is_home: true,
      components: [],
    };

    const state = builderReducer(
      currentState,
      builderActions.applyImportedScreens([importedScreen]),
    );

    expect(state.project.screens).toHaveLength(1);
    expect(state.project.screens[0].id).toBe('imported');
    expect(state.project.app_name).toBe(currentState.project.app_name);
    expect(state.project.package_name).toBe(currentState.project.package_name);
    expect(state.projectTitle).toBe(currentState.projectTitle);
    expect(state.projectDescription).toBe(currentState.projectDescription);
    expect(state.serverProjectId).toBe(42);
    expect(state.activeScreenId).toBe('imported');
  });

  it('keeps ListTile actions as an array for the Flutter generator', () => {
    const exportedListTile = exportProject(CreateBuilderState().project).screens[0].components[2];

    if (exportedListTile.type !== 'ListTile') throw new Error('Expected an exported ListTile');

    expect(exportedListTile.props.actions).toEqual([{ type: 'navigate', route: '/details' }]);
  });

  it('normalizes legacy ListTile action objects when a project is imported', () => {
    const legacyScreen: Screen = {
      id: 'legacy',
      name: 'Legacy',
      route: '/',
      is_home: true,
      components: [
        {
          id: 'legacy-tile',
          type: 'ListTile',
          props: {
            title: 'Profile',
            actions: { type: 'navigate', route: '/profile' },
          },
        } as unknown as FlutterWidget,
      ],
    };
    const importedState = builderReducer(
      CreateBuilderState(),
      builderActions.importProjectData({
        app_name: 'Legacy App',
        package_name: 'com.example.legacy',
        screens: [legacyScreen],
      }),
    );
    const listTile = importedState.project.screens[0].components[0];

    if (listTile.type !== 'ListTile') throw new Error('Expected an imported ListTile');

    expect(listTile.props.actions).toEqual([{ type: 'navigate', route: '/profile' }]);
  });
});
