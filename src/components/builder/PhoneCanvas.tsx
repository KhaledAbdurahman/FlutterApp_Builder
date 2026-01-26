import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { FlutterWidget, WidgetType } from "@/types/flutter";
import { useBuilderStore } from "@/store/builderStore";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface WidgetRendererProps {
  widget: FlutterWidget;
  depth?: number;
  renderContext?: {
    isScaffoldBody?: boolean;
  };
}

interface DrawerContentProps {
  drawer: FlutterWidget;
  depth: number;
  isDragging: boolean;
  onSelect: (id: string) => void;
}

const DrawerContent = ({
  drawer,
  depth,
  isDragging,
  onSelect,
}: DrawerContentProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${drawer.id}`,
    data: { type: "widget", widgetId: drawer.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 overflow-auto p-3",
        isOver && isDragging && "ring-2 ring-accent ring-dashed",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(drawer.id);
      }}
    >
      {drawer.children && drawer.children.length > 0 ? (
        drawer.children.map((child) => (
          <WidgetRenderer key={child.id} widget={child} depth={depth + 1} />
        ))
      ) : (
        <DropZoneIndicator />
      )}
    </div>
  );
};

const RESERVED_SCAFFOLD_TYPES: WidgetType[] = [
  "AppBar",
  "Drawer",
  "BottomNavigationBar",
];

const getScaffoldSlots = (scaffold: FlutterWidget) => {
  const children = scaffold.children || [];
  const appBar = children.find((child) => child.type === "AppBar");
  const drawer = children.find((child) => child.type === "Drawer");
  const bottomNavigationBar = children.find(
    (child) => child.type === "BottomNavigationBar",
  );
  const bodyChildren = children.filter(
    (child) => !RESERVED_SCAFFOLD_TYPES.includes(child.type),
  );

  // TODO: Decide how to represent multiple body children in a Scaffold. Currently only the first is rendered.
  const body = bodyChildren[0];

  return { appBar, drawer, bottomNavigationBar, body, bodyChildren };
};

const toLucideName = (icon?: string) => {
  if (!icon) return "";
  return icon
    .replace(/[-_]+/g, " ")
    .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^(.)/, (chr) => chr.toUpperCase())
    .replace(/\s/g, "");
};

const resolveLucideIcon = (icon?: string) => {
  const name = toLucideName(icon);
  return (LucideIcons as any)[name] || LucideIcons.Circle;
};

const WidgetRenderer = ({
  widget,
  depth = 0,
  renderContext,
}: WidgetRendererProps) => {
  const { selectedWidgetId, setSelectedWidget, isDragging } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const scaffoldSlots =
    widget.type === "Scaffold" ? getScaffoldSlots(widget) : null;
  const hasAppBarSlot = !!scaffoldSlots?.appBar;
  const hasDrawerSlot = !!scaffoldSlots?.drawer;
  const hasBottomNavSlot = !!scaffoldSlots?.bottomNavigationBar;
  const hasBodySlot = !!scaffoldSlots?.body;

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${widget.id}`,
    data: { type: "widget", widgetId: widget.id },
  });

  const { setNodeRef: setAppBarSlotRef, isOver: isOverAppBarSlot } =
    useDroppable({
      id: `scaffold-slot-${widget.id}-appBar`,
      data: { type: "scaffold-slot", scaffoldId: widget.id, slot: "appBar" },
      disabled: widget.type !== "Scaffold" || hasAppBarSlot,
    });

  const { setNodeRef: setDrawerSlotRef, isOver: isOverDrawerSlot } =
    useDroppable({
      id: `scaffold-slot-${widget.id}-drawer`,
      data: { type: "scaffold-slot", scaffoldId: widget.id, slot: "drawer" },
      disabled: widget.type !== "Scaffold" || hasDrawerSlot,
    });

  const { setNodeRef: setBodySlotRef, isOver: isOverBodySlot } = useDroppable({
    id: `scaffold-slot-${widget.id}-body`,
    data: { type: "scaffold-slot", scaffoldId: widget.id, slot: "body" },
    disabled: widget.type !== "Scaffold" || hasBodySlot,
  });

  const { setNodeRef: setBottomNavSlotRef, isOver: isOverBottomNavSlot } =
    useDroppable({
      id: `scaffold-slot-${widget.id}-bottomNavigationBar`,
      data: {
        type: "scaffold-slot",
        scaffoldId: widget.id,
        slot: "bottomNavigationBar",
      },
      disabled: widget.type !== "Scaffold" || hasBottomNavSlot,
    });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWidget(widget.id);
  };

  const baseClasses = cn(
    "relative transition-all duration-150 cursor-pointer",
    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
    isOver && isDragging && "ring-2 ring-accent ring-dashed",
    "hover:ring-1 hover:ring-primary/50",
  );

  const renderChildren = () => {
    if (!widget.children || widget.children.length === 0) {
      return null;
    }
    return widget.children.map((child) => (
      <WidgetRenderer key={child.id} widget={child} depth={depth + 1} />
    ));
  };

  switch (widget.type) {
    case "Scaffold": {
      const { appBar, drawer, bottomNavigationBar, body } =
        getScaffoldSlots(widget);
      const appBarHeight = appBar ? (appBar.props.height ?? 56) : 0;
      const bottomNavHeight = bottomNavigationBar
        ? (bottomNavigationBar.props.height ?? 56)
        : 0;
      const safeAreaTop = 0;
      const safeAreaBottom = 0;
      // TODO: Decide how to compute safe area insets for different device presets.

      const bodyOverflow = body?.type === "Column" ? "hidden" : "auto";
      const MenuIcon = LucideIcons.Menu;

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            "flex flex-col h-full bg-white text-gray-900 relative",
          )}
        >
          {/* AppBar slot */}
          <div
            ref={setAppBarSlotRef}
            style={{ height: appBarHeight + safeAreaTop }}
            className={cn(
              "shrink-0",
              isOverAppBarSlot &&
                isDragging &&
                "ring-2 ring-accent ring-dashed",
            )}
          >
            {appBar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(appBar.id);
                }}
                className={cn(
                  "flex items-center px-4 gap-2",
                  selectedWidgetId === appBar.id && "ring-2 ring-primary",
                )}
                style={{
                  height: appBar.props.height ?? 56,
                  backgroundColor: appBar.props.backgroundColor || "#6200EE",
                }}
              >
                {drawer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDrawerOpen(!isDrawerOpen);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/20"
                    aria-label="Open navigation drawer"
                  >
                    <MenuIcon className="w-5 h-5 text-white" />
                  </button>
                )}
                <div
                  className={cn(
                    "flex-1",
                    appBar.props.centerTitle ? "text-center" : "text-left",
                  )}
                >
                  <span className="text-white font-medium text-lg">
                    {appBar.props.title || "App Bar"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Body slot */}
          <div
            ref={setBodySlotRef}
            className={cn(
              "flex-1 min-h-0",
              bodyOverflow === "auto" ? "overflow-auto" : "overflow-hidden",
              isOverBodySlot && isDragging && "ring-2 ring-accent ring-dashed",
            )}
            style={{
              maxHeight: `calc(100% - ${appBarHeight + bottomNavHeight + safeAreaTop + safeAreaBottom}px)`,
            }}
          >
            {body ? (
              <WidgetRenderer
                widget={body}
                depth={depth + 1}
                renderContext={{ isScaffoldBody: true }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <DropZoneIndicator />
              </div>
            )}
          </div>

          {/* BottomNavigationBar slot */}
          <div
            ref={setBottomNavSlotRef}
            style={{ height: bottomNavHeight + safeAreaBottom }}
            className={cn(
              "shrink-0",
              isOverBottomNavSlot &&
                isDragging &&
                "ring-2 ring-accent ring-dashed",
            )}
          >
            {bottomNavigationBar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(bottomNavigationBar.id);
                }}
                className="h-full border-t border-gray-200 bg-white flex items-center justify-around px-4"
              >
                {bottomNavigationBar.props.items &&
                bottomNavigationBar.props.items.length > 0 ? (
                  bottomNavigationBar.props.items.map((item, index) => {
                    const IconComponent = resolveLucideIcon(item.icon);
                    const isActive =
                      (bottomNavigationBar.props.currentIndex ?? 0) === index;
                    return (
                      <div
                        key={`${item.label}-${index}`}
                        className="flex flex-col items-center text-xs"
                      >
                        <IconComponent
                          className="w-5 h-5"
                          style={{
                            color: isActive
                              ? bottomNavigationBar.props.selectedItemColor ||
                                "#6200EE"
                              : bottomNavigationBar.props.unselectedItemColor ||
                                "#757575",
                          }}
                        />
                        <span
                          style={{
                            color: isActive
                              ? bottomNavigationBar.props.selectedItemColor ||
                                "#6200EE"
                              : bottomNavigationBar.props.unselectedItemColor ||
                                "#757575",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center text-xs text-muted-foreground">
                      {(() => {
                        const HomeIcon = resolveLucideIcon("home");
                        return <HomeIcon className="w-5 h-5" />;
                      })()}
                      <span>Home</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer overlay */}
          {drawer && (
            <>
              {isDrawerOpen && (
                <div
                  className="absolute inset-0 bg-black/40 z-20"
                  onClick={() => setIsDrawerOpen(false)}
                />
              )}
              <motion.div
                className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg z-30"
                initial={{ x: -260 }}
                animate={{ x: isDrawerOpen ? 0 : -260 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div
                  ref={setDrawerSlotRef}
                  className={cn(
                    "h-full flex flex-col",
                    isOverDrawerSlot &&
                      isDragging &&
                      "ring-2 ring-accent ring-dashed",
                  )}
                >
                  <div
                    className="p-4 text-white"
                    style={{
                      backgroundColor:
                        drawer.props.header?.backgroundColor || "#6200EE",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWidget(drawer.id);
                    }}
                  >
                    <p className="font-semibold">
                      {drawer.props.header?.title || "Menu"}
                    </p>
                    {drawer.props.header?.subtitle && (
                      <p className="text-xs opacity-80">
                        {drawer.props.header.subtitle}
                      </p>
                    )}
                  </div>
                  <DrawerContent
                    drawer={drawer}
                    depth={depth}
                    isDragging={isDragging}
                    onSelect={setSelectedWidget}
                  />
                </div>
              </motion.div>
            </>
          )}
        </div>
      );
    }

    case "AppBar":
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, "flex items-center px-4")}
          style={{
            height: widget.props.height ?? 56,
            backgroundColor: widget.props.backgroundColor || "#6200EE",
          }}
        >
          <span className="text-white font-medium text-lg">
            {widget.props.title || "App Bar"}
          </span>
        </div>
      );

    case "Container":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "min-h-[40px]")}
          style={{
            backgroundColor: widget.props.backgroundColor || "transparent",
            padding: widget.props.padding || 0,
            margin: widget.props.margin || 0,
            borderRadius: widget.props.borderRadius || 0,
            border: widget.props.border ? "1px solid #ccc" : "none",
          }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Center":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            "flex-1 flex items-center justify-center min-h-[60px]",
          )}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Row":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "flex flex-row min-h-[40px] gap-2")}
          style={{
            justifyContent: alignmentToFlex(widget.props.mainAxisAlignment),
            alignItems: alignmentToFlex(widget.props.crossAxisAlignment),
          }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Column":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            "flex flex-col min-h-[40px] gap-2",
            renderContext?.isScaffoldBody && "h-full min-h-0 overflow-auto",
          )}
          style={{
            justifyContent: alignmentToFlex(widget.props.mainAxisAlignment),
            alignItems: alignmentToFlex(widget.props.crossAxisAlignment),
          }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Stack":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "relative min-h-[60px]")}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Text":
      return (
        <span
          onClick={handleClick}
          className={cn(baseClasses, "inline-block")}
          style={{
            fontSize: widget.props.fontSize || 16,
            color: widget.props.color || "#000000",
            fontWeight: widget.props.fontWeight === "bold" ? 700 : 400,
            textAlign: (widget.props.alignment as any) || "left",
          }}
        >
          {widget.props.text || "Text"}
        </span>
      );

    case "Button":
      return (
        <button
          onClick={handleClick}
          className={cn(
            baseClasses,
            "px-6 py-2 rounded-md text-white font-medium",
          )}
          style={{ backgroundColor: "#6200EE" }}
        >
          {widget.props.text || "Button"}
        </button>
      );

    case "TextField":
      return (
        <input
          onClick={handleClick}
          type="text"
          placeholder={widget.props.hintText || "Enter text..."}
          className={cn(
            baseClasses,
            "border border-gray-300 rounded-md px-3 py-2 w-full",
          )}
          readOnly
        />
      );

    case "Icon": {
      const IconComponent = resolveLucideIcon(widget.props.icon);
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, "flex items-center justify-center")}
          style={{
            width: widget.props.size || 24,
            height: widget.props.size || 24,
            color: widget.props.color || "#000000",
          }}
        >
          <IconComponent className="w-full h-full" />
        </div>
      );
    }
    case "Drawer":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            "bg-white border border-gray-200 rounded-md",
          )}
        >
          <div
            className="p-3 text-white"
            style={{
              backgroundColor:
                widget.props.header?.backgroundColor || "#6200EE",
            }}
          >
            <p className="font-semibold">
              {widget.props.header?.title || "Menu"}
            </p>
            {widget.props.header?.subtitle && (
              <p className="text-xs opacity-80">
                {widget.props.header.subtitle}
              </p>
            )}
          </div>
          <div className="p-3">
            {renderChildren()}
            {(!widget.children || widget.children.length === 0) && (
              <DropZoneIndicator />
            )}
          </div>
        </div>
      );
    case "BottomNavigationBar":
      return (
        <div
          onClick={handleClick}
          className={cn(
            baseClasses,
            "border-t border-gray-200 bg-white flex items-center justify-around px-4",
          )}
          style={{ height: widget.props.height ?? 56 }}
        >
          {widget.props.items && widget.props.items.length > 0 ? (
            widget.props.items.map((item, index) => {
              const IconComponent = resolveLucideIcon(item.icon);
              const isActive = (widget.props.currentIndex ?? 0) === index;
              const color = isActive
                ? widget.props.selectedItemColor || "#6200EE"
                : widget.props.unselectedItemColor || "#757575";
              return (
                <div
                  key={`${item.label}-${index}`}
                  className="flex flex-col items-center text-xs"
                >
                  <IconComponent className="w-5 h-5" style={{ color }} />
                  <span style={{ color }}>{item.label}</span>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center text-xs text-muted-foreground">
                {(() => {
                  const HomeIcon = resolveLucideIcon("home");
                  return <HomeIcon className="w-5 h-5" />;
                })()}
                <span>Home</span>
              </div>
            </div>
          )}
        </div>
      );

    case "Image":
      return (
        <img
          onClick={handleClick}
          src={widget.props.src || "https://via.placeholder.com/150"}
          alt="Widget"
          className={cn(baseClasses, "max-w-full h-auto")}
          style={{ objectFit: (widget.props.fit as any) || "cover" }}
        />
      );

    case "SizedBox":
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, "bg-gray-100")}
          style={{
            width: widget.props.width || 0,
            height: widget.props.height || 0,
          }}
        />
      );

    case "Padding":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses)}
          style={{ padding: widget.props.padding || 16 }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Card":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "bg-white rounded-lg p-4 min-h-[60px]")}
          style={{
            boxShadow: `0 ${(widget.props.elevation || 2) * 2}px ${(widget.props.elevation || 2) * 4}px rgba(0,0,0,0.1)`,
          }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "Expanded":
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "min-h-[40px]")}
          style={{ flex: widget.props.flex || 1 }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case "ListView":
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, "overflow-auto max-h-[200px]")}
        >
          {Array.from({ length: widget.props.itemCount || 5 }).map((_, i) => (
            <div key={i} className="p-3 border-b border-gray-200">
              List Item {i + 1}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, "p-2 bg-gray-100 rounded")}
        >
          {widget.type}
        </div>
      );
  }
};

const DropZoneIndicator = () => (
  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-gray-400 text-sm">
    Drop widget here
  </div>
);

const alignmentToFlex = (alignment?: string): string => {
  switch (alignment) {
    case "start":
      return "flex-start";
    case "end":
      return "flex-end";
    case "center":
      return "center";
    case "spaceBetween":
      return "space-between";
    case "spaceAround":
      return "space-around";
    case "spaceEvenly":
      return "space-evenly";
    case "stretch":
      return "stretch";
    case "baseline":
      return "baseline";
    default:
      return "flex-start";
  }
};

export const PhoneCanvas = () => {
  const { getActiveScreen, setSelectedWidget, isDragging } = useBuilderStore();
  const screen = getActiveScreen();
  const hasScaffold = useMemo(
    () => !!screen?.components.some((widget) => widget.type === "Scaffold"),
    [screen],
  );

  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root",
    data: { type: "canvas" },
  });

  const handleCanvasClick = () => {
    setSelectedWidget(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-canvas overflow-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative"
      >
        {/* Phone Frame */}
        <div className="relative w-[375px] h-[812px] rounded-[3rem] bg-gradient-to-b from-gray-800 to-gray-900 p-3 shadow-elevated">
          {/* Screen */}
          <div
            ref={setNodeRef}
            onClick={handleCanvasClick}
            className={cn(
              "w-full h-full rounded-[2.5rem] overflow-hidden bg-white relative",
              isOver && isDragging && "ring-4 ring-primary/50",
            )}
          >
            {/* Status Bar */}
            <div className="h-11 bg-gray-900 flex items-center justify-between px-6 text-white text-xs">
              <span className="ml-auto text-red-400">This is a demo app</span>
            </div>

            {/* Content */}
            <div
              className={cn(
                "h-[calc(100%-2.75rem)]",
                hasScaffold ? "overflow-hidden" : "overflow-auto",
              )}
            >
              {screen?.components.map((widget) => (
                <WidgetRenderer key={widget.id} widget={widget} />
              ))}
              {(!screen?.components || screen.components.length === 0) && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 p-8">
                    <p className="text-lg font-medium mb-2">Empty Screen</p>
                    <p className="text-sm">
                      Drag and drop widgets from the left panel
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
