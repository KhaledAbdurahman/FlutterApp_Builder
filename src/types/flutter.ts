// Button action types
export interface ButtonAction {
  type: 'snackbar' | 'dialog' | 'navigate' | 'goBack';
  message?: string; // for snackbar
  title?: string; // for dialog
  route?: string; // for navigate
}

export interface WidgetProps {
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  border?: boolean;
  mainAxisAlignment?: 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  crossAxisAlignment?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  title?: string;
  elevation?: number;
  hintText?: string;
  icon?: string;
  size?: number;
  src?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'scaleDown';
  width?: number;
  height?: number;
  flex?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  onPress?: string;
  navigateTo?: string;
  itemCount?: number;
  actions?: ButtonAction[];
}

export interface FlutterWidget {
  id: string;
  type: WidgetType;
  props: WidgetProps;
  children?: FlutterWidget[];
  itemTemplate?: FlutterWidget;
}

export type WidgetType =
  | 'Scaffold'
  | 'AppBar'
  | 'Container'
  | 'Row'
  | 'Column'
  | 'Stack'
  | 'Positioned'
  | 'Expanded'
  | 'SizedBox'
  | 'Padding'
  | 'Center'
  | 'Card'
  | 'ListView'
  | 'Text'
  | 'Button'
  | 'TextField'
  | 'Icon'
  | 'Image';

export interface Screen {
  id: string;
  name: string;
  route: string;
  is_home: boolean;
  components: FlutterWidget[];
}

export interface Project {
  app_name: string;
  package_name: string;
  screens: Screen[];
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: string;
  category: 'layout' | 'content' | 'input';
  canHaveChildren: boolean;
  defaultProps: WidgetProps;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Layout widgets
  { type: 'Scaffold', label: 'Scaffold', icon: 'Layout', category: 'layout', canHaveChildren: true, defaultProps: {} },
  { type: 'AppBar', label: 'App Bar', icon: 'PanelTop', category: 'layout', canHaveChildren: false, defaultProps: { title: 'App Title', backgroundColor: '#6200EE', elevation: 4 } },
  { type: 'Container', label: 'Container', icon: 'Square', category: 'layout', canHaveChildren: true, defaultProps: { padding: 16 } },
  { type: 'Row', label: 'Row', icon: 'GalleryHorizontal', category: 'layout', canHaveChildren: true, defaultProps: { mainAxisAlignment: 'start', crossAxisAlignment: 'center' } },
  { type: 'Column', label: 'Column', icon: 'GalleryVertical', category: 'layout', canHaveChildren: true, defaultProps: { mainAxisAlignment: 'start', crossAxisAlignment: 'center' } },
  { type: 'Stack', label: 'Stack', icon: 'Layers', category: 'layout', canHaveChildren: true, defaultProps: {} },
  { type: 'Positioned', label: 'Positioned', icon: 'Move', category: 'layout', canHaveChildren: true, defaultProps: { top: 0, left: 0 } },
  { type: 'Center', label: 'Center', icon: 'AlignCenter', category: 'layout', canHaveChildren: true, defaultProps: {} },
  { type: 'Padding', label: 'Padding', icon: 'SpaceBetweenVertically', category: 'layout', canHaveChildren: true, defaultProps: { padding: 8 } },
  { type: 'SizedBox', label: 'Sized Box', icon: 'RulerIcon', category: 'layout', canHaveChildren: false, defaultProps: { width: 100, height: 100 } },
  { type: 'Expanded', label: 'Expanded', icon: 'Maximize', category: 'layout', canHaveChildren: true, defaultProps: { flex: 1 } },
  { type: 'Card', label: 'Card', icon: 'CreditCard', category: 'layout', canHaveChildren: true, defaultProps: { elevation: 1 } },
  { type: 'ListView', label: 'List View', icon: 'List', category: 'layout', canHaveChildren: false, defaultProps: { itemCount: 10 } },

  // Content widgets
  { type: 'Text', label: 'Text', icon: 'Type', category: 'content', canHaveChildren: false, defaultProps: { text: 'Hello World', fontSize: 16, fontWeight: 'normal', alignment: 'left' } },
  { type: 'Icon', label: 'Icon', icon: 'Star', category: 'content', canHaveChildren: false, defaultProps: { icon: 'star', size: 24, color: '#000000' } },
  { type: 'Image', label: 'Image', icon: 'ImageIcon', category: 'content', canHaveChildren: false, defaultProps: { src: 'https://via.placeholder.com/150', fit: 'cover' } },

  // Input widgets  
  { type: 'Button', label: 'Button', icon: 'MousePointerClick', category: 'input', canHaveChildren: false, defaultProps: { text: 'Click Me', actions: [] } },
  { type: 'TextField', label: 'Text Field', icon: 'FormInput', category: 'input', canHaveChildren: false, defaultProps: { hintText: 'Enter text...' } },
];

export const getWidgetDefinition = (type: WidgetType): WidgetDefinition | undefined => {
  return WIDGET_DEFINITIONS.find(w => w.type === type);
};
