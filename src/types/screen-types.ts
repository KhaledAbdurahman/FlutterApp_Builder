export type ActionBase =
  | { type: "snackbar"; message: string }
  | { type: "dialog"; title: string; message: string }
  | { type: "navigate"; route: string }
  | { type: "goBack" };

export type ComponentType =
  | "Scaffold"
  | "AppBar"
  | "Container"
  | "Row"
  | "Column"
  | "ListView"
  | "Positioned"
  | "Expanded"
  | "SizedBox"
  | "Padding"
  | "Center"
  | "Card"
  | "Text"
  | "Button"
  | "TextField"
  | "Icon"
  | "Image"
  | "BottomNavigationBar"
  | "Drawer"
  | "ListTile";

export type BaseComponent = { id: string };

export type BottomNavItem = {
  label: string;
  icon: string;
  route: string;
};

export type DrawerHeader = {
  title: string;
  subtitle: string;
  backgroundColor: string;
};

export type ComponentPropsByType = {
  Scaffold: { backgroundColor: string };
  AppBar: {
    color: string;
    title: string;
    backgroundColor: string;
    elevation: number;
    centerTitle: boolean;
    showBackButton: boolean;
    automaticallyImplyLeading: boolean;
    height?: number;
  };
  Container: {
    layout?: { w: number; h: number };
    backgroundColor: string;
    padding: number;
    margin: number;
    borderRadius: number;
    border: boolean;
    borderColor: string;
    borderWidth: number;
    alignment:
      | "center"
      | "topLeft"
      | "topRight"
      | "bottomLeft"
      | "bottomRight"
      | "topCenter"
      | "bottomCenter"
      | "centerLeft"
      | "centerRight";
  };
  Row: {
    mainAxisAlignment:
      | "start"
      | "end"
      | "center"
      | "spaceBetween"
      | "spaceAround"
      | "spaceEvenly";
    crossAxisAlignment: "start" | "end" | "center" | "stretch" | "baseline";
    mainAxisSize: "min" | "max";
  };
  Column: {
    mainAxisAlignment:
      | "start"
      | "end"
      | "center"
      | "spaceBetween"
      | "spaceAround"
      | "spaceEvenly";
    crossAxisAlignment: "start" | "end" | "center" | "stretch" | "baseline";
    mainAxisSize: "min" | "max";
  };
  ListView: { itemCount?: number; shrinkWrap?: boolean; padding?: number };
  Positioned: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
  Expanded: { flex?: number };
  SizedBox: { width?: number; height?: number };
  Padding: { all?: number };
  Center: {};
  Card: {
    elevation: number;
    color: string;
    margin: number;
    borderRadius: number;
  };
  Text: {
    text: string;
    fontSize: number;
    color: string;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    letterSpacing: number;
    decoration: "none" | "underline" | "overline" | "lineThrough";
    alignment: "left" | "right" | "center" | "justify" | "start" | "end";
    maxLines?: number;
    overflow?: "clip" | "fade" | "ellipsis" | "visible";
  };
  Button: {
    text: string;
    backgroundColor: string;
    color: string;
    elevation: number;
    borderRadius: number;
    actions: ActionBase[];
  };
  TextField: {
    hintText: string;
    labelText: string;
    obscureText: boolean;
    keyboardType: "text" | "number" | "email" | "phone" | "url" | "multiline";
    prefixIcon?: string;
    border: boolean;
  };
  Icon: { icon: string; color: string; size: number };
  Image: {
    src: string;
    fit: "cover" | "contain" | "fill" | "fitWidth" | "fitHeight" | "scaleDown";
    width?: number;
    height?: number;
  };
  BottomNavigationBar: {
    currentIndex: number;
    type: "fixed" | "shifting";
    selectedItemColor: string;
    unselectedItemColor: string;
    items: BottomNavItem[];
    height?: number;
  };
  Drawer: {
    header: DrawerHeader;
  };
  /**
   * TO USE ONLY WITH DRAWER COMPONENT
   */
  ListTile: {
    title: string;
    icon: string;
    actions: { type: "navigate"; route: string };
  };
};

export type Components = {
  [K in ComponentType]: BaseComponent & {
    type: K;
    props: Partial<ComponentPropsByType[K]>;
    children?: Components[];
    itemTemplate?: Components;
  };
}[ComponentType];

export type Screens = {
  id: string;
  name: string;
  route: string;
  is_home: boolean;
  components: Components[];
};

export type Project = {
  app_name: string;
  package_name: string;
  screens: Screens[];
};

export type WidgetType = ComponentType;
export type FlutterWidget = Components;
export type Screen = Screens;
export type WidgetProps = Partial<ComponentPropsByType[ComponentType]>;

export type WidgetCategory = "layout" | "content" | "input" | "navigation";

export type ChildCardinality = "none" | "single" | "multiple";

export type ChildConfig = {
  mode: ChildCardinality;
  maxChildren?: number;
  allowedChildren?: ComponentType[];
};

export type WidgetDefinition<K extends ComponentType = ComponentType> = {
  type: K;
  label: string;
  icon: string;
  category: WidgetCategory;
  canHaveChildren: boolean;
  childConfig: ChildConfig;
  defaultProps: ComponentPropsByType[K];
};

export const DEFAULT_COMPONENT_PROPS: ComponentPropsByType = {
  Scaffold: { backgroundColor: "#FFFFFF" },
  AppBar: {
    title: "App Title",
    backgroundColor: "#6200EE",
    elevation: 4,
    centerTitle: true,
    showBackButton: false,
    automaticallyImplyLeading: true,
    height: 56,
    color: "#FFFFFF",
  },
  Container: {
    layout: { w: 0, h: 0 },
    backgroundColor: "transparent",
    padding: 16,
    margin: 0,
    borderRadius: 0,
    border: false,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    alignment: "center",
  },
  Row: {
    mainAxisAlignment: "start",
    crossAxisAlignment: "center",
    mainAxisSize: "max",
  },
  Column: {
    mainAxisAlignment: "start",
    crossAxisAlignment: "center",
    mainAxisSize: "max",
  },
  ListView: { itemCount: 0, shrinkWrap: false, padding: 0 },
  Positioned: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: 100,
  },
  Expanded: { flex: 1 },
  SizedBox: { width: 100, height: 100 },
  Padding: { all: 8 },
  Center: {},
  Card: {
    elevation: 1,
    color: "#FFFFFF",
    margin: 0,
    borderRadius: 12,
  },
  Text: {
    text: "Hello World",
    fontSize: 16,
    color: "#000000",
    fontWeight: "normal",
    fontStyle: "normal",
    letterSpacing: 0,
    decoration: "none",
    alignment: "left",
    maxLines: 1,
    overflow: "visible",
  },
  Button: {
    text: "Click Me",
    backgroundColor: "#6200EE",
    color: "#FFFFFF",
    elevation: 0,
    borderRadius: 8,
    actions: [],
  },
  TextField: {
    hintText: "Enter text...",
    labelText: "",
    obscureText: false,
    keyboardType: "text",
    prefixIcon: "",
    border: true,
  },
  Icon: { icon: "star", color: "#000000", size: 24 },
  Image: {
    src: "https://web.dev/static/images/learn-header_1440.png",
    fit: "cover",
    width: 150,
    height: 150,
  },
  BottomNavigationBar: {
    currentIndex: 0,
    type: "fixed",
    selectedItemColor: "#6200EE",
    unselectedItemColor: "#757575",
    items: [{ label: "Home", icon: "home", route: "/" }],
    height: 56,
  },
  Drawer: {
    header: {
      title: "Menu",
      subtitle: "Welcome",
      backgroundColor: "#6200EE",
    },
  },
  ListTile: {
    title: "List Item",
    icon: "circle",
    actions: { type: "navigate", route: "/" },
  },
};

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    type: "Scaffold",
    label: "Scaffold",
    icon: "Layout",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "multiple", maxChildren: 4 },
    defaultProps: DEFAULT_COMPONENT_PROPS.Scaffold,
  },
  {
    type: "AppBar",
    label: "App Bar",
    icon: "PanelTop",
    category: "layout",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.AppBar,
  },
  {
    type: "Container",
    label: "Container",
    icon: "Square",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "multiple" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Container,
  },
  {
    type: "Row",
    label: "Row",
    icon: "GalleryHorizontal",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "multiple" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Row,
  },
  {
    type: "Column",
    label: "Column",
    icon: "GalleryVertical",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "multiple" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Column,
  },
  {
    type: "Positioned",
    label: "Positioned",
    icon: "Move",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "single" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Positioned,
  },
  {
    type: "Center",
    label: "Center",
    icon: "AlignCenter",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "single" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Center,
  },
  {
    type: "Padding",
    label: "Padding",
    icon: "SpaceBetweenVertically",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "single" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Padding,
  },
  {
    type: "SizedBox",
    label: "Sized Box",
    icon: "RulerIcon",
    category: "layout",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.SizedBox,
  },
  {
    type: "Expanded",
    label: "Expanded",
    icon: "Maximize",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "single" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Expanded,
  },
  {
    type: "Card",
    label: "Card",
    icon: "CreditCard",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "single" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Card,
  },
  {
    type: "ListView",
    label: "List View",
    icon: "List",
    category: "layout",
    canHaveChildren: true,
    childConfig: { mode: "multiple" },
    defaultProps: DEFAULT_COMPONENT_PROPS.ListView,
  },
  {
    type: "Text",
    label: "Text",
    icon: "Type",
    category: "content",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Text,
  },
  {
    type: "Icon",
    label: "Icon",
    icon: "Star",
    category: "content",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Icon,
  },
  {
    type: "Image",
    label: "Image",
    icon: "ImageIcon",
    category: "content",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Image,
  },
  {
    type: "ListTile",
    label: "List Tile",
    icon: "ListOrdered",
    category: "content",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.ListTile,
  },
  {
    type: "Button",
    label: "Button",
    icon: "MousePointerClick",
    category: "input",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.Button,
  },
  {
    type: "TextField",
    label: "Text Field",
    icon: "FormInput",
    category: "input",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.TextField,
  },
  {
    type: "BottomNavigationBar",
    label: "Bottom Nav",
    icon: "PanelBottom",
    category: "navigation",
    canHaveChildren: false,
    childConfig: { mode: "none" },
    defaultProps: DEFAULT_COMPONENT_PROPS.BottomNavigationBar,
  },
  {
    type: "Drawer",
    label: "Drawer",
    icon: "Menu",
    category: "navigation",
    canHaveChildren: true,
    childConfig: {
      mode: "single",
      allowedChildren: ["Column"],
      maxChildren: 1,
    },
    defaultProps: DEFAULT_COMPONENT_PROPS.Drawer,
  },
];

export const getWidgetDefinition = (
  type: ComponentType,
): WidgetDefinition | undefined => {
  return WIDGET_DEFINITIONS.find((w) => w.type === type);
};

export const getChildConfig = (
  type: ComponentType,
): ChildConfig | undefined => {
  return getWidgetDefinition(type)?.childConfig;
};

export const resolveWidgetProps = <K extends ComponentType>(
  type: K,
  props?: Partial<ComponentPropsByType[K]>,
): ComponentPropsByType[K] => {
  const defaults = DEFAULT_COMPONENT_PROPS[type] as ComponentPropsByType[K];
  if (type === "Container") {
    const containerProps = props as
      | Partial<ComponentPropsByType["Container"]>
      | undefined;
    return {
      ...defaults,
      ...(props || {}),
      layout: {
        ...(defaults as ComponentPropsByType["Container"]).layout,
        ...containerProps?.layout,
      },
    } as ComponentPropsByType[K];
  }
  if (type === "Drawer") {
    const drawerProps = props as
      | Partial<ComponentPropsByType["Drawer"]>
      | undefined;
    return {
      ...defaults,
      ...(props || {}),
      header: {
        ...(defaults as ComponentPropsByType["Drawer"]).header,
        ...drawerProps?.header,
      },
    } as ComponentPropsByType[K];
  }
  if (type === "BottomNavigationBar") {
    const bottomNavProps = props as
      | Partial<ComponentPropsByType["BottomNavigationBar"]>
      | undefined;
    return {
      ...defaults,
      ...(props || {}),
      items:
        bottomNavProps?.items ??
        (defaults as ComponentPropsByType["BottomNavigationBar"]).items,
    } as ComponentPropsByType[K];
  }
  return { ...defaults, ...(props || {}) } as ComponentPropsByType[K];
};
