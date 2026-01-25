// Button action types
export interface ButtonAction {
  type: "snackbar" | "dialog" | "navigate" | "goBack";
  message?: string; // for snackbar and dialog
  title?: string; // for dialog
  route?: string; // for navigate
}

// BottomNavigationBar item
export interface BottomNavItem {
  label: string;
  icon: string;
  route: string;
}

// Drawer header
export interface DrawerHeader {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
}

export interface WidgetProps {
  //Common
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: "normal" | "bold";
  alignment?: "left" | "right" | "center" | "justify" | "start" | "end";
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  border?: boolean;
  width?: number;
  height?: number;

  // Container specific
  borderColor?: string;
  borderWidth?: number;

  // Row/Column specific

  mainAxisAlignment?:
    | "start"
    | "end"
    | "center"
    | "spaceBetween"
    | "spaceAround"
    | "spaceEvenly";
  crossAxisAlignment?: "start" | "end" | "center" | "stretch" | "baseline";
  mainAxisSize?: "min" | "max";

  // AppBar specific
  title?: string;
  elevation?: number;
  centerTitle?: boolean;
  showBackButton?: boolean;
  automaticallyImplyLeading?: boolean;

  // TextField specific
  hintText?: string;
  labelText?: string;
  obscureText?: boolean;
  keyboardType?: "text" | "number" | "email" | "phone" | "url" | "multiline";
  prefixIcon?: string;

  // Icon specific
  icon?: string;
  size?: number;

  // Image specific
  src?: string;
  fit?: "cover" | "contain" | "fill" | "fitWidth" | "fitHeight" | "scaleDown";

  // Positioned/Expanded specific
  flex?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;

  // Text specific (additional)
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
  decoration?: "none" | "underline" | "overline" | "lineThrough";
  maxLines?: number;
  overflow?: "clip" | "fade" | "ellipsis" | "visible";

  // Button specific
  onPress?: string;
  navigateTo?: string;
  // itemCount?: number;
  actions?: ButtonAction[];

  // ListView specific
  itemCount?: number;
  shrinkWrap?: boolean;

  // BottomNavigationBar specific
  currentIndex?: number;
  type?: "fixed" | "shifting";
  selectedItemColor?: string;
  unselectedItemColor?: string;
  items?: BottomNavItem[];

  // Drawer specific
  header?: DrawerHeader;
}

export interface FlutterWidget {
  id: string;
  type: WidgetType;
  props: WidgetProps;
  children?: FlutterWidget[];
  itemTemplate?: FlutterWidget;
}

export type WidgetType =
  | "Scaffold"
  | "AppBar"
  | "Container"
  | "Row"
  | "Column"
  | "Stack"
  | "Positioned"
  | "Expanded"
  | "SizedBox"
  | "Padding"
  | "Center"
  | "Card"
  | "ListView"
  | "Text"
  | "Button"
  | "TextField"
  | "Icon"
  | "Image"
  | "BottomNavigationBar"
  | "Drawer"
  | "ListTile";

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
  category: "layout" | "content" | "input" | "navigation";
  canHaveChildren: boolean;
  defaultProps: WidgetProps;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Layout widgets
  {
    type: "Scaffold",
    label: "Scaffold",
    icon: "Layout",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {},
  },
  {
    type: "AppBar",
    label: "App Bar",
    icon: "PanelTop",
    category: "layout",
    canHaveChildren: false,
    defaultProps: {
      title: "App Title",
      backgroundColor: "#6200EE",
      elevation: 4,
      centerTitle: true,
    },
  },
  {
    type: "Container",
    label: "Container",
    icon: "Square",
    category: "layout",
    canHaveChildren: true,
    defaultProps: { padding: 16 },
  },
  {
    type: "Row",
    label: "Row",
    icon: "GalleryHorizontal",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      mainAxisAlignment: "start",
      crossAxisAlignment: "center",
      mainAxisSize: "max",
    },
  },
  {
    type: "Column",
    label: "Column",
    icon: "GalleryVertical",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      mainAxisAlignment: "start",
      crossAxisAlignment: "center",
      mainAxisSize: "max",
    },
  },
  {
    type: "Stack",
    label: "Stack",
    icon: "Layers",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {},
  },
  {
    type: "Positioned",
    label: "Positioned",
    icon: "Move",
    category: "layout",
    canHaveChildren: true,
    defaultProps: { top: 0, left: 0 },
  },
  {
    type: "Center",
    label: "Center",
    icon: "AlignCenter",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {},
  },
  {
    type: "Padding",
    label: "Padding",
    icon: "SpaceBetweenVertically",
    category: "layout",
    canHaveChildren: true,
    defaultProps: { padding: 8 },
  },
  {
    type: "SizedBox",
    label: "Sized Box",
    icon: "RulerIcon",
    category: "layout",
    canHaveChildren: false,
    defaultProps: { width: 100, height: 100 },
  },
  {
    type: "Expanded",
    label: "Expanded",
    icon: "Maximize",
    category: "layout",
    canHaveChildren: true,
    defaultProps: { flex: 1 },
  },
  {
    type: "Card",
    label: "Card",
    icon: "CreditCard",
    category: "layout",
    canHaveChildren: true,
    defaultProps: { elevation: 1 },
  },
  {
    type: "ListView",
    label: "List View",
    icon: "List",
    category: "layout",
    canHaveChildren: false,
    defaultProps: { itemCount: 10, shrinkWrap: false },
  },

  // Content widgets
  {
    type: "Text",
    label: "Text",
    icon: "Type",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      text: "Hello World",
      fontSize: 16,
      fontWeight: "normal",
      fontStyle: "normal",
      alignment: "left",
    },
  },
  {
    type: "Icon",
    label: "Icon",
    icon: "Star",
    category: "content",
    canHaveChildren: false,
    defaultProps: { icon: "star", size: 24, color: "#000000" },
  },
  {
    type: "Image",
    label: "Image",
    icon: "ImageIcon",
    category: "content",
    canHaveChildren: false,
    defaultProps: { src: "https://via.placeholder.com/150", fit: "cover" },
  },
  {
    type: "ListTile",
    label: "List Tile",
    icon: "ListOrdered",
    category: "content",
    canHaveChildren: false,
    defaultProps: { title: "List Item", icon: "circle" },
  },

  // Input widgets
  {
    type: "Button",
    label: "Button",
    icon: "MousePointerClick",
    category: "input",
    canHaveChildren: false,
    defaultProps: { text: "Click Me", actions: [] },
  },
  {
    type: "TextField",
    label: "Text Field",
    icon: "FormInput",
    category: "input",
    canHaveChildren: false,
    defaultProps: { hintText: "Enter text...", keyboardType: "text" },
  },

  // Navigation widgets
  {
    type: "BottomNavigationBar",
    label: "Bottom Nav",
    icon: "PanelBottom",
    category: "navigation",
    canHaveChildren: false,
    defaultProps: {
      currentIndex: 0,
      type: "fixed",
      selectedItemColor: "#6200EE",
      unselectedItemColor: "#757575",
      items: [],
    },
  },
  {
    type: "Drawer",
    label: "Drawer",
    icon: "Menu",
    category: "navigation",
    canHaveChildren: true,
    defaultProps: {
      header: {
        title: "Menu",
        subtitle: "Welcome",
        backgroundColor: "#6200EE",
      },
    },
  },
];

export const getWidgetDefinition = (
  type: WidgetType,
): WidgetDefinition | undefined => {
  return WIDGET_DEFINITIONS.find((w) => w.type === type);
};
