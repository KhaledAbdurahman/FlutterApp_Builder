import { v4 as uuidv4 } from 'uuid';
import type { FlutterWidget, Project, Screen } from '@/types/screen-types';

const DEFAULT_APP_NAME = 'my_flutter_app';
const DEFAULT_PACKAGE_NAME = 'com.example.myapp';
const IMPORT_FALLBACK_APP_NAME = 'My App';
const IMPORT_FALLBACK_PACKAGE_NAME = 'com.example.app';

const createDefaultScreen = (): Screen => ({
  id: uuidv4(),
  name: 'Home',
  route: '/',
  is_home: true,
  components: [
    {
      id: uuidv4(),
      type: 'Scaffold',
      props: { backgroundColor: '#FFFFFF' },
      children: [
        {
          id: uuidv4(),
          type: 'AppBar',
          props: { title: 'My App', backgroundColor: '#3B82F6' },
        },
        {
          id: uuidv4(),
          type: 'Center',
          props: {},
          children: [
            {
              id: uuidv4(),
              type: 'Column',
              props: { mainAxisAlignment: 'center' },
              children: [
                {
                  id: uuidv4(),
                  type: 'Text',
                  props: {
                    text: 'Welcome to Flutter Builder!',
                    fontSize: 24,
                    fontWeight: 'bold',
                  },
                },
                {
                  id: uuidv4(),
                  type: 'SizedBox',
                  props: { height: 20 },
                },
                {
                  id: uuidv4(),
                  type: 'Button',
                  props: { text: 'Get Started' },
                },
              ],
            },
          ],
        },
      ],
    } as FlutterWidget,
  ],
});

const createInitialProject = (): Project => ({
  app_name: DEFAULT_APP_NAME,
  package_name: DEFAULT_PACKAGE_NAME,
  screens: [createDefaultScreen()],
});

export {
  DEFAULT_APP_NAME,
  DEFAULT_PACKAGE_NAME,
  IMPORT_FALLBACK_APP_NAME,
  IMPORT_FALLBACK_PACKAGE_NAME,
  createDefaultScreen,
  createInitialProject,
};
