type ComponentType =
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
Layout Components
Scaffold.props = {
backgroundColor?: string; // hex
};

AppBar.props = {
title?: string;
color?: string; // title text color
backgroundColor?: string;
elevation?: number;
centerTitle?: boolean;
showBackButton?: boolean;
automaticallyImplyLeading?: boolean;
};

Container.props = {
width?: number | string;
height?: number | string;
backgroundColor?: string;
padding?: number;
margin?: number;
borderRadius?: number;
border?: boolean;
borderColor?: string;
borderWidth?: number;
alignment?: string; // e.g. center, topLeft
};

Row.props / Column.props = {
mainAxisAlignment?: string; // start, center, spaceBetween, etc.
crossAxisAlignment?: string; // start, center, stretch, etc.
mainAxisSize?: string; // min | max
};

Stack.props = {};

Positioned.props = {
top?: number;
bottom?: number;
left?: number;
right?: number;
width?: number;
height?: number;
};

Expanded.props = {
flex?: number;
};

SizedBox.props = {
width?: number;
height?: number;
};

Padding.props = {
padding?: number;
};

Center.props = {};

Card.props = {
elevation?: number;
color?: string;
margin?: number;
borderRadius?: number;
};
Content/Input Components
Text.props = {
text?: string;
fontSize?: number;
color?: string;
fontWeight?: string; // bold, normal, w300, w400, etc.
fontStyle?: string; // normal, italic
letterSpacing?: number;
decoration?: string; // underline, lineThrough, etc.
alignment?: string; // center, left, right
maxLines?: number;
overflow?: string; // ellipsis, clip, fade
};

Button.props = {
text?: string;
backgroundColor?: string;
color?: string;
textColor?: string;
elevation?: number;
borderRadius?: number;
onPress?: string;
actions?: Action[];
};

TextField.props = {
hintText?: string;
labelText?: string;
obscureText?: boolean;
keyboardType?: string; // text, number, emailAddress, phone, etc.
border?: boolean;
prefixIcon?: string;
};

Icon.props = {
icon?: string; // Flutter Icons name, e.g. home
size?: number;
color?: string;
};

Image.props = {
src?: string; // URL or asset path
fit?: string; // cover, contain, fill, etc.
width?: number;
height?: number;
};
Navigation/Special Components
ListView.props = {
itemCount?: number;
shrinkWrap?: boolean;
padding?: number;
};
// Uses: itemTemplate

BottomNavigationBar.props = {
currentIndex?: number;
type?: string; // fixed | shifting
selectedItemColor?: string;
unselectedItemColor?: string;
};
// Uses: items array

Drawer.props = {
header?: {
title?: string;
subtitle?: string;
backgroundColor?: string;
};
};

ListTile.props = {
title?: string;
subtitle?: string;
icon?: string;
trailingIcon?: string;
actions?: Action[];
};
Children Rules
// exactly/at most one child
Container, Center, Padding, Expanded, SizedBox, Positioned, Card

// multiple children
Row, Column, Stack, Drawer, Scaffold

// no children
Text, Image, Icon, TextField, Button, ListTile

// special
ListView uses itemTemplate
BottomNavigationBar uses items
Actions
type Action =
| { type: "snackbar"; message?: string }
| { type: "dialog"; title?: string; message?: string }
| { type: "navigate"; route?: string }
| { type: "goBack" };
Bottom Nav Item
type BottomNavItem = {
label?: string;
icon?: string;
route?: string;
};
