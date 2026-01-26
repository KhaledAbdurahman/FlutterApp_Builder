type ActionBase =
  | { type: "snackbar"; message: string }
  | { type: "dialog"; title: string; message: string }
  | { type: "navigate"; route: string }
  | { type: "goBack" };

type ComponentType =
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
  | "Drawer";

type BaseComponent = { id: string };

type ComponentPropsByType = {
  Scaffold: { backgroundColor: string };
  AppBar: {
    title: string;
    backgroundColor: string;
    elevation: number;
    centerTitle: boolean;
    showBackButton: boolean;
    automaticallyImplyLeading: boolean;
  };
  Container: {
    layout: { w: number; h: number };
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
    actions: [ActionBase];
  };
  TextField: {
    hintText: string;
    labelText: string;
    obscureText: boolean;
    keyboardType: "text" | "number" | "email" | "phone" | "url" | "multiline";
    prefixIcon?: string;
    border: true;
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
    items: { label: string; icon: string; route: string }[];
  };
  Drawer: {
    header: {
      title: "Menu";
      subtitle: "Welcome";
      backgroundColor: "#6200EE";
    };
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

type Components = {
  [K in ComponentType]: BaseComponent & {
    type: K;
    props: ComponentPropsByType[K];
    children?: Components[];
  };
}[ComponentType];

export type Screens = {
  id: string;
  name: string;
  route: string;
  is_home: true;
  components: Components[];
};

export type Project = {
  app_name: string;
  package_name: string;
  screens: Screens[];
};

//stack
// Positioned
