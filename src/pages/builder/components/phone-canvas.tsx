import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentPropsByType, FlutterWidget, WidgetType } from '@/types/screen-types';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';

interface IWidgetRendererProps {
  widget: FlutterWidget;
  depth?: number;
  renderContext?: {
    isScaffoldBody?: boolean;
    parentFlexDirection?: 'row' | 'column';
  };
}

interface IDrawerContentProps {
  drawer: FlutterWidget;
  depth: number;
  isDragging: boolean;
  onSelect: (id: string) => void;
}

const DrawerContent = ({ drawer, depth, isDragging, onSelect }: IDrawerContentProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${drawer.id}`,
    data: { type: 'widget', widgetId: drawer.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 overflow-auto p-3',
        isOver && isDragging && 'ring-2 ring-accent ring-dashed',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(drawer.id);
      }}
    >
      {drawer.children?.[0] ? (
        <WidgetRenderer key={drawer.children[0].id} widget={drawer.children[0]} depth={depth + 1} />
      ) : (
        <DropZoneIndicator />
      )}
    </div>
  );
};

const RESERVED_SCAFFOLD_TYPES: WidgetType[] = ['AppBar', 'Drawer', 'BottomNavigationBar'];

const FlutterImageFitToCssObjectFit: Record<
  ComponentPropsByType['Image']['fit'],
  CSSProperties['objectFit']
> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'fill',
  fitWidth: 'cover',
  fitHeight: 'cover',
  scaleDown: 'scale-down',
};

const getScaffoldSlots = (scaffold: FlutterWidget) => {
  const children = scaffold.children || [];
  const appBar = children.find((child) => child.type === 'AppBar');
  const drawer = children.find((child) => child.type === 'Drawer');
  const bottomNavigationBar = children.find((child) => child.type === 'BottomNavigationBar');
  const bodyChildren = children.filter((child) => !RESERVED_SCAFFOLD_TYPES.includes(child.type));

  const body = bodyChildren[0];

  return { appBar, drawer, bottomNavigationBar, body };
};

const toLucideName = (icon?: string) => {
  if (!icon) return '';
  return icon
    .replace(/[-_]+/g, ' ')
    .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^(.)/, (chr) => chr.toUpperCase())
    .replace(/\s/g, '');
};

const isLucideIcon = (icon: unknown): icon is LucideIcon =>
  typeof icon === 'object' && icon !== null && '$$typeof' in icon;

const resolveLucideIcon = (icon?: string): LucideIcon => {
  const name = toLucideName(icon);
  const resolvedIcon = LucideIcons[name as keyof typeof LucideIcons];
  return isLucideIcon(resolvedIcon) ? resolvedIcon : LucideIcons.Circle;
};

const WidgetRenderer = ({ widget, depth = 0, renderContext }: IWidgetRendererProps) => {
  const { selectedWidgetId, setSelectedWidget, isDragging } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const scaffoldSlots = widget.type === 'Scaffold' ? getScaffoldSlots(widget) : null;
  const hasAppBarSlot = !!scaffoldSlots?.appBar;
  const hasDrawerSlot = !!scaffoldSlots?.drawer;
  const hasBottomNavSlot = !!scaffoldSlots?.bottomNavigationBar;
  const hasBodySlot = !!scaffoldSlots?.body;

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${widget.id}`,
    data: { type: 'widget', widgetId: widget.id },
  });

  const { setNodeRef: setAppBarSlotRef, isOver: isOverAppBarSlot } = useDroppable({
    id: `scaffold-slot-${widget.id}-appBar`,
    data: { type: 'scaffold-slot', scaffoldId: widget.id, slot: 'appBar' },
    disabled: widget.type !== 'Scaffold' || hasAppBarSlot,
  });

  const { setNodeRef: setDrawerSlotRef, isOver: isOverDrawerSlot } = useDroppable({
    id: `scaffold-slot-${widget.id}-drawer`,
    data: { type: 'scaffold-slot', scaffoldId: widget.id, slot: 'drawer' },
    disabled: widget.type !== 'Scaffold' || hasDrawerSlot,
  });

  const { setNodeRef: setBodySlotRef, isOver: isOverBodySlot } = useDroppable({
    id: `scaffold-slot-${widget.id}-body`,
    data: { type: 'scaffold-slot', scaffoldId: widget.id, slot: 'body' },
    disabled: widget.type !== 'Scaffold' || hasBodySlot,
  });

  const { setNodeRef: setBottomNavSlotRef, isOver: isOverBottomNavSlot } = useDroppable({
    id: `scaffold-slot-${widget.id}-bottomNavigationBar`,
    data: {
      type: 'scaffold-slot',
      scaffoldId: widget.id,
      slot: 'bottomNavigationBar',
    },
    disabled: widget.type !== 'Scaffold' || hasBottomNavSlot,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWidget(widget.id);
  };

  const baseClasses = cn(
    'relative shrink-0 cursor-pointer transition-all duration-150',
    isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
    isOver && isDragging && 'ring-2 ring-accent ring-dashed',
    'hover:ring-1 hover:ring-primary/50',
  );

  const renderChildren = (parentFlexDirection?: 'row' | 'column') => {
    if (!widget.children || widget.children.length === 0) {
      return null;
    }
    return widget.children.map((child) => (
      <WidgetRenderer
        key={child.id}
        widget={child}
        depth={depth + 1}
        renderContext={parentFlexDirection ? { parentFlexDirection } : undefined}
      />
    ));
  };

  const renderSingleChild = (childRenderContext?: IWidgetRendererProps['renderContext']) => {
    const child = widget.children?.[0];
    return child ? (
      <WidgetRenderer
        key={child.id}
        widget={child}
        depth={depth + 1}
        renderContext={childRenderContext}
      />
    ) : null;
  };

  const renderStackChildren = () =>
    widget.children?.map((child) =>
      child.type === 'Positioned' ? (
        <WidgetRenderer key={child.id} widget={child} depth={depth + 1} />
      ) : (
        <div key={child.id} className="col-start-1 row-start-1 self-start justify-self-start">
          <WidgetRenderer widget={child} depth={depth + 1} />
        </div>
      ),
    );

  switch (widget.type) {
    case 'Scaffold': {
      const { appBar, drawer, bottomNavigationBar, body } = getScaffoldSlots(widget);
      const appBarHeight = appBar ? (appBar.props.height ?? 56) : 0;
      const bottomNavHeight = bottomNavigationBar ? (bottomNavigationBar.props.height ?? 56) : 0;
      const safeAreaTop = 0;
      const safeAreaBottom = 0;
      // TODO: Decide how to compute safe area insets for different device presets.

      const bodyControlsOverflow = body?.type === 'Column' || body?.type === 'ListView';
      const MenuIcon = LucideIcons.Menu;

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'flex flex-col h-full text-gray-900 relative')}
          style={{ backgroundColor: widget.props.backgroundColor || '#FFFFFF' }}
        >
          {/* AppBar slot */}
          <div
            ref={setAppBarSlotRef}
            style={{ height: appBarHeight + safeAreaTop }}
            className={cn(
              'shrink-0',
              isOverAppBarSlot && isDragging && 'ring-2 ring-accent ring-dashed',
            )}
          >
            {appBar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(appBar.id);
                }}
                className={cn(
                  'flex items-center px-4 gap-2',
                  selectedWidgetId === appBar.id && 'ring-2 ring-primary',
                )}
                style={{
                  height: appBar.props.height ?? 56,
                  backgroundColor: appBar.props.backgroundColor || '#6200EE',
                  boxShadow:
                    (appBar.props.elevation ?? 0) > 0
                      ? `0 ${(appBar.props.elevation ?? 0) * 2}px ${(appBar.props.elevation ?? 0) * 4}px rgba(0,0,0,0.15)`
                      : 'none',
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
                {!drawer && appBar.props.showBackButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/20"
                    aria-label="Back"
                  >
                    <LucideIcons.ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <div
                  className={cn('flex-1', appBar.props.centerTitle ? 'text-center' : 'text-left')}
                >
                  <span
                    className="font-medium text-lg"
                    style={{ color: appBar.props.color || '#FFFFFF' }}
                  >
                    {appBar.props.title || 'App Bar'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Body slot */}
          <div
            ref={setBodySlotRef}
            className={cn(
              'min-h-0 flex-1',
              bodyControlsOverflow ? 'overflow-hidden' : 'overflow-auto',
              isOverBodySlot && isDragging && 'ring-2 ring-accent ring-dashed',
            )}
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
              'shrink-0',
              isOverBottomNavSlot && isDragging && 'ring-2 ring-accent ring-dashed',
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
                {bottomNavigationBar.props.items && bottomNavigationBar.props.items.length > 0 ? (
                  bottomNavigationBar.props.items.map((item, index) => {
                    const IconComponent = resolveLucideIcon(item.icon);
                    const isActive = (bottomNavigationBar.props.currentIndex ?? 0) === index;
                    return (
                      <div
                        key={`${item.label}-${index}`}
                        className="flex flex-col items-center text-xs"
                      >
                        <IconComponent
                          className="w-5 h-5"
                          style={{
                            color: isActive
                              ? bottomNavigationBar.props.selectedItemColor || '#6200EE'
                              : bottomNavigationBar.props.unselectedItemColor || '#757575',
                          }}
                        />
                        <span
                          style={{
                            color: isActive
                              ? bottomNavigationBar.props.selectedItemColor || '#6200EE'
                              : bottomNavigationBar.props.unselectedItemColor || '#757575',
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
                        const HomeIcon = resolveLucideIcon('home');
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
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <div
                  ref={setDrawerSlotRef}
                  className={cn(
                    'h-full flex flex-col',
                    isOverDrawerSlot && isDragging && 'ring-2 ring-accent ring-dashed',
                  )}
                >
                  <div
                    className="p-4 text-white"
                    style={{
                      backgroundColor: drawer.props.header?.backgroundColor || '#6200EE',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWidget(drawer.id);
                    }}
                  >
                    <p className="font-semibold">{drawer.props.header?.title || 'Menu'}</p>
                    {drawer.props.header?.subtitle && (
                      <p className="text-xs opacity-80">{drawer.props.header.subtitle}</p>
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

    case 'AppBar':
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, 'flex items-center px-4')}
          style={{
            height: widget.props.height ?? 56,
            backgroundColor: widget.props.backgroundColor || '#6200EE',
            boxShadow:
              (widget.props.elevation ?? 0) > 0
                ? `0 ${(widget.props.elevation ?? 0) * 2}px ${(widget.props.elevation ?? 0) * 4}px rgba(0,0,0,0.15)`
                : 'none',
          }}
        >
          {widget.props.showBackButton && (
            <LucideIcons.ArrowLeft className="w-5 h-5 text-white mr-2" />
          )}
          <span className="font-medium text-lg" style={{ color: widget.props.color || '#FFFFFF' }}>
            {widget.props.title || 'App Bar'}
          </span>
        </div>
      );

    case 'Container': {
      const width = resolveContainerLayoutValue(widget.props.layout?.w);
      const height = resolveContainerLayoutValue(widget.props.layout?.h);

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'min-h-[40px] min-w-0')}
          style={{
            backgroundColor: widget.props.backgroundColor || 'transparent',
            padding: widget.props.padding ?? 0,
            margin: widget.props.margin ?? 0,
            borderRadius: widget.props.borderRadius ?? 0,
            border: widget.props.border
              ? `${widget.props.borderWidth ?? 1}px solid ${widget.props.borderColor || '#ccc'}`
              : 'none',
            width: renderContext?.isScaffoldBody && width === 'auto' ? '100%' : width,
            height: renderContext?.isScaffoldBody && height === 'auto' ? '100%' : height,
            display: 'flex',
            justifyContent: alignmentToJustify(widget.props.alignment),
            alignItems: alignmentToAlign(widget.props.alignment),
          }}
        >
          {renderSingleChild(renderContext?.isScaffoldBody ? { isScaffoldBody: true } : undefined)}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );
    }

    case 'Center':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            'flex min-h-[60px] min-w-0 items-center justify-center',
            renderContext?.isScaffoldBody && 'h-full w-full',
          )}
        >
          {renderSingleChild(renderContext?.isScaffoldBody ? { isScaffoldBody: true } : undefined)}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );

    case 'Row':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'flex min-h-[40px] min-w-0 flex-row')}
          style={{
            justifyContent: alignmentToFlex(widget.props.mainAxisAlignment),
            alignItems: alignmentToFlex(widget.props.crossAxisAlignment),
            width: widget.props.mainAxisSize === 'max' ? '100%' : 'fit-content',
          }}
        >
          {renderChildren('row')}
          {(!widget.children || widget.children.length === 0) && <DropZoneIndicator />}
        </div>
      );

    case 'Column':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            'flex min-h-[40px] min-w-0 flex-col',
            renderContext?.isScaffoldBody &&
              widget.props.mainAxisSize !== 'min' &&
              'h-full overflow-auto',
          )}
          style={{
            justifyContent: alignmentToFlex(widget.props.mainAxisAlignment),
            alignItems: alignmentToFlex(widget.props.crossAxisAlignment),
            width: renderContext?.isScaffoldBody ? '100%' : 'fit-content',
            height:
              renderContext?.isScaffoldBody && widget.props.mainAxisSize !== 'min'
                ? '100%'
                : 'fit-content',
          }}
        >
          {renderChildren('column')}
          {(!widget.children || widget.children.length === 0) && <DropZoneIndicator />}
        </div>
      );

    case 'Stack':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            'relative grid min-h-[120px] w-full overflow-hidden',
            renderContext?.isScaffoldBody && 'h-full',
          )}
        >
          {renderStackChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop stacked children" />
          )}
        </div>
      );

    case 'Text':
      return (
        <span
          onClick={handleClick}
          className={cn(baseClasses, 'inline-block')}
          style={{
            fontSize: widget.props.fontSize || 16,
            color: widget.props.color || '#000000',
            fontWeight: widget.props.fontWeight === 'bold' ? 700 : 400,
            textAlign: alignmentToTextAlign(widget.props.alignment),
            fontStyle: widget.props.fontStyle || 'normal',
            letterSpacing: widget.props.letterSpacing ?? 0,
            textDecoration: widget.props.decoration || 'none',
            display: widget.props.maxLines ? '-webkit-box' : 'inline-block',
            WebkitBoxOrient: widget.props.maxLines ? 'vertical' : undefined,
            WebkitLineClamp: widget.props.maxLines,
            overflow: widget.props.maxLines ? 'hidden' : undefined,
            textOverflow: widget.props.overflow === 'ellipsis' ? 'ellipsis' : undefined,
          }}
        >
          {widget.props.text || 'Text'}
        </span>
      );

    case 'Button':
      return (
        <button
          onClick={handleClick}
          className={cn(baseClasses, 'px-6 py-2 rounded-md text-white font-medium')}
          style={{
            backgroundColor: widget.props.backgroundColor || '#6200EE',
            color: widget.props.color || '#FFFFFF',
            borderRadius: widget.props.borderRadius ?? 8,
            boxShadow:
              (widget.props.elevation ?? 0) > 0
                ? `0 ${(widget.props.elevation ?? 0) * 2}px ${(widget.props.elevation ?? 0) * 4}px rgba(0,0,0,0.15)`
                : 'none',
          }}
        >
          {widget.props.text || 'Button'}
        </button>
      );

    case 'TextField':
      return (
        <input
          onClick={handleClick}
          type={widget.props.obscureText ? 'password' : 'text'}
          placeholder={widget.props.hintText || 'Enter text...'}
          className={cn(baseClasses, 'border border-gray-300 rounded-md px-3 py-2 w-full')}
          style={{
            border: widget.props.border === false ? 'none' : undefined,
          }}
          aria-label={widget.props.labelText || widget.props.hintText}
          inputMode={
            widget.props.keyboardType === 'number'
              ? 'numeric'
              : widget.props.keyboardType === 'email'
                ? 'email'
                : widget.props.keyboardType === 'phone'
                  ? 'tel'
                  : widget.props.keyboardType === 'url'
                    ? 'url'
                    : 'text'
          }
          readOnly
        />
      );

    case 'Icon': {
      const IconComponent = resolveLucideIcon(widget.props.icon);
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, 'flex items-center justify-center')}
          style={{
            width: widget.props.size || 24,
            height: widget.props.size || 24,
            color: widget.props.color || '#000000',
          }}
        >
          <IconComponent className="w-full h-full" />
        </div>
      );
    }
    case 'Drawer':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'bg-white border border-gray-200 rounded-md')}
        >
          <div
            className="p-3 text-white"
            style={{
              backgroundColor: widget.props.header?.backgroundColor || '#6200EE',
            }}
          >
            <p className="font-semibold">{widget.props.header?.title || 'Menu'}</p>
            {widget.props.header?.subtitle && (
              <p className="text-xs opacity-80">{widget.props.header.subtitle}</p>
            )}
          </div>
          <div className="p-3">
            {renderSingleChild()}
            {(!widget.children || widget.children.length === 0) && (
              <DropZoneIndicator label="Drop one Drawer child" />
            )}
          </div>
        </div>
      );

    case 'ListTile': {
      const IconComponent = resolveLucideIcon(widget.props.icon);
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, 'flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted')}
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{widget.props.title || 'List Item'}</p>
            {widget.props.actions?.route && (
              <p className="text-xs text-muted-foreground">{widget.props.actions.route}</p>
            )}
          </div>
          <LucideIcons.ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    }
    case 'BottomNavigationBar':
      return (
        <div
          onClick={handleClick}
          className={cn(
            baseClasses,
            'border-t border-gray-200 bg-white flex items-center justify-around px-4',
          )}
          style={{ height: widget.props.height ?? 56 }}
        >
          {widget.props.items && widget.props.items.length > 0 ? (
            widget.props.items.map((item, index) => {
              const IconComponent = resolveLucideIcon(item.icon);
              const isActive = (widget.props.currentIndex ?? 0) === index;
              const color = isActive
                ? widget.props.selectedItemColor || '#6200EE'
                : widget.props.unselectedItemColor || '#757575';
              return (
                <div key={`${item.label}-${index}`} className="flex flex-col items-center text-xs">
                  <IconComponent className="w-5 h-5" style={{ color }} />
                  <span style={{ color }}>{item.label}</span>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center text-xs text-muted-foreground">
                {(() => {
                  const HomeIcon = resolveLucideIcon('home');
                  return <HomeIcon className="w-5 h-5" />;
                })()}
                <span>Home</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'Image':
      return (
        <img
          onClick={handleClick}
          src={widget.props.src || 'https://via.placeholder.com/150'}
          alt="Widget"
          className={cn(baseClasses, 'max-w-full h-auto')}
          style={{
            objectFit: FlutterImageFitToCssObjectFit[widget.props.fit || 'cover'],
            width: widget.props.width,
            height: widget.props.height,
          }}
        />
      );

    case 'SizedBox':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            'min-h-0 min-w-0 overflow-hidden',
            (!widget.children || widget.children.length === 0) && 'bg-gray-100',
          )}
          style={{
            width: widget.props.width ?? 'auto',
            height: widget.props.height ?? 'auto',
          }}
        >
          {renderSingleChild()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" compact />
          )}
        </div>
      );

    case 'Padding':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses)}
          style={{ padding: widget.props.all ?? 16 }}
        >
          {renderSingleChild()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );

    case 'Card':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'min-h-[60px] bg-white')}
          style={{
            backgroundColor: widget.props.color || '#FFFFFF',
            margin: widget.props.margin || 0,
            borderRadius: widget.props.borderRadius ?? 12,
            boxShadow: `0 ${(widget.props.elevation || 2) * 2}px ${(widget.props.elevation || 2) * 4}px rgba(0,0,0,0.1)`,
          }}
        >
          {renderSingleChild()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );

    case 'Expanded':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'min-h-0 min-w-0')}
          style={{
            flexGrow: widget.props.flex ?? 1,
            flexShrink: 1,
            flexBasis: 0,
            minHeight:
              !widget.children || widget.children.length === 0
                ? 40
                : renderContext?.parentFlexDirection === 'column'
                  ? 0
                  : undefined,
            minWidth:
              !widget.children || widget.children.length === 0
                ? 40
                : renderContext?.parentFlexDirection === 'row'
                  ? 0
                  : undefined,
          }}
        >
          {renderSingleChild()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );

    case 'ListView':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(
            baseClasses,
            'min-h-0 min-w-0 overflow-auto',
            renderContext?.isScaffoldBody && !widget.props.shrinkWrap && 'h-full w-full',
          )}
          style={{
            padding: widget.props.padding ?? 0,
          }}
        >
          {(() => {
            const explicitCount = widget.props.itemCount ?? 0;
            const count = explicitCount > 0 ? explicitCount : 3;

            if (widget.itemTemplate) {
              return Array.from({ length: count }).map((_, i) => (
                <WidgetRenderer
                  key={`${widget.itemTemplate.id}-${i}`}
                  widget={{
                    ...widget.itemTemplate,
                    id: `${widget.itemTemplate.id}-${i}`,
                  }}
                  depth={(depth ?? 0) + 1}
                />
              ));
            }

            return <DropZoneIndicator label="Drop an item template" />;
          })()}
        </div>
      );

    case 'Positioned': {
      const hasWidth = widget.props.width !== undefined;
      const hasHeight = widget.props.height !== undefined;

      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, 'min-h-[40px]')}
          style={{
            position: 'absolute',
            top: widget.props.top,
            left: widget.props.left,
            right: hasWidth ? undefined : widget.props.right,
            bottom: hasHeight ? undefined : widget.props.bottom,
            width: widget.props.width,
            height: widget.props.height,
          }}
        >
          {renderSingleChild()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop one child" />
          )}
        </div>
      );
    }

    default:
      return null;
  }
};

interface IDropZoneIndicatorProps {
  label?: string;
  compact?: boolean;
}

const DropZoneIndicator = ({
  label = 'Drop widget here',
  compact = false,
}: IDropZoneIndicatorProps) => (
  <div
    className={cn(
      'box-border flex w-full items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-slate-50/70 text-slate-400',
      compact ? 'h-full min-h-0 min-w-0' : 'min-h-10 min-w-10',
    )}
    aria-label={label}
    title={label}
  >
    <LucideIcons.Plus className={compact ? 'h-3 w-3 shrink-0' : 'h-4 w-4 shrink-0'} />
  </div>
);

const alignmentToFlex = (alignment?: string): string => {
  switch (alignment) {
    case 'start':
      return 'flex-start';
    case 'end':
      return 'flex-end';
    case 'center':
      return 'center';
    case 'spaceBetween':
      return 'space-between';
    case 'spaceAround':
      return 'space-around';
    case 'spaceEvenly':
      return 'space-evenly';
    case 'stretch':
      return 'stretch';
    case 'baseline':
      return 'baseline';
    default:
      return 'flex-start';
  }
};

const alignmentToJustify = (alignment?: string): string => {
  switch (alignment) {
    case 'topLeft':
    case 'centerLeft':
    case 'bottomLeft':
      return 'flex-start';
    case 'topRight':
    case 'centerRight':
    case 'bottomRight':
      return 'flex-end';
    case 'topCenter':
    case 'center':
    case 'bottomCenter':
      return 'center';
    default:
      return 'center';
  }
};

const alignmentToAlign = (alignment?: string): string => {
  switch (alignment) {
    case 'topLeft':
    case 'topCenter':
    case 'topRight':
      return 'flex-start';
    case 'bottomLeft':
    case 'bottomCenter':
    case 'bottomRight':
      return 'flex-end';
    case 'centerLeft':
    case 'center':
    case 'centerRight':
      return 'center';
    default:
      return 'center';
  }
};

const resolveContainerLayoutValue = (value?: number): number | 'auto' | undefined => {
  if (value == null || value === 0) return 'auto';
  return value;
};

const alignmentToTextAlign = (alignment?: string): 'left' | 'right' | 'center' | 'justify' => {
  switch (alignment) {
    case 'right':
    case 'end':
      return 'right';
    case 'center':
      return 'center';
    case 'justify':
      return 'justify';
    case 'left':
    case 'start':
    default:
      return 'left';
  }
};

const PIXEL_VIEWPORT_WIDTH = 412;
const PIXEL_VIEWPORT_HEIGHT = 915;
const PIXEL_FRAME_WIDTH = PIXEL_VIEWPORT_WIDTH + 14;
const PIXEL_FRAME_HEIGHT = PIXEL_VIEWPORT_HEIGHT + 14;
const MINIMUM_ZOOM = 40;
const MAXIMUM_ZOOM = 125;
const DEFAULT_ZOOM = 75;
const ZOOM_STEP = 5;

export const PhoneCanvas = () => {
  const { getActiveScreen, getWidgetById, selectedWidgetId, setSelectedWidget, isDragging } =
    useBuilderStore();
  const screen = getActiveScreen();
  const selectedWidget = selectedWidgetId ? getWidgetById(selectedWidgetId) : undefined;
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const zoomScale = zoom / 100;
  const scaledFrameWidth = PIXEL_FRAME_WIDTH * zoomScale;
  const scaledFrameHeight = PIXEL_FRAME_HEIGHT * zoomScale;

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { type: 'canvas' },
  });

  const handleCanvasClick = () => {
    setSelectedWidget(null);
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f1f3f6]">
      <div className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <LucideIcons.Smartphone className="h-4 w-4 text-slate-700" />
          <span className="font-medium text-slate-700">Pixel 8</span>
          <span>6.2 in</span>
          <span className="hidden xl:inline">1080 x 2400</span>
        </div>

        <div className="flex h-8 items-center border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            className="grid h-full w-8 place-items-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() =>
              setZoom((currentZoom) => Math.max(MINIMUM_ZOOM, currentZoom - ZOOM_STEP))
            }
            disabled={zoom <= MINIMUM_ZOOM}
            aria-label="Zoom out"
          >
            <LucideIcons.Minus className="h-4 w-4" />
          </button>
          <span className="min-w-12 border-x border-slate-200 px-2 text-center text-xs font-medium leading-8 text-slate-700">
            {zoom}%
          </span>
          <button
            type="button"
            className="grid h-full w-8 place-items-center text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() =>
              setZoom((currentZoom) => Math.min(MAXIMUM_ZOOM, currentZoom + ZOOM_STEP))
            }
            disabled={zoom >= MAXIMUM_ZOOM}
            aria-label="Zoom in"
          >
            <LucideIcons.Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="grid h-full w-8 place-items-center text-slate-500 hover:bg-slate-50"
            onClick={() => setZoom(DEFAULT_ZOOM)}
            aria-label="Reset zoom"
          >
            <LucideIcons.RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-w-40 truncate text-xs text-slate-500">
          {selectedWidget ? selectedWidget.type : 'Select a widget'}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div
          className="grid min-h-full min-w-full place-items-center bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:24px_24px] p-10"
          style={{
            minWidth: scaledFrameWidth + 80,
            minHeight: scaledFrameHeight + 80,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
            style={{ width: scaledFrameWidth, height: scaledFrameHeight }}
          >
            <div
              className="origin-top-left"
              style={{
                width: PIXEL_FRAME_WIDTH,
                height: PIXEL_FRAME_HEIGHT,
                transform: `scale(${zoomScale})`,
              }}
            >
              <div
                className="relative rounded-[38px] border-[7px] border-[#202124] bg-[#202124] shadow-[0_28px_70px_rgba(15,23,42,0.28)]"
                style={{ width: PIXEL_FRAME_WIDTH, height: PIXEL_FRAME_HEIGHT }}
              >
                <div className="pointer-events-none absolute left-1/2 top-[16px] z-30 h-3 w-3 -translate-x-1/2 rounded-full bg-[#111318] ring-1 ring-black/50" />
                <div
                  ref={setNodeRef}
                  onClick={handleCanvasClick}
                  className={cn(
                    'relative h-full w-full overflow-hidden rounded-[30px] bg-white',
                    isOver && isDragging && 'ring-4 ring-primary/50 ring-inset',
                  )}
                >
                  <div className="flex h-9 items-center justify-between bg-white px-7 pt-1 text-[10px] font-semibold text-slate-900">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <LucideIcons.Signal className="h-3 w-3" />
                      <LucideIcons.Wifi className="h-3 w-3" />
                      <LucideIcons.BatteryMedium className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="h-[calc(100%-2.25rem)] overflow-y-auto pb-5">
                    {screen?.components.map((widget) => (
                      <WidgetRenderer key={widget.id} widget={widget} />
                    ))}
                    {(!screen?.components || screen.components.length === 0) && (
                      <div className="flex h-full items-center justify-center p-8 text-center">
                        <div className="border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-slate-500">
                          <LucideIcons.LayoutTemplate className="mx-auto mb-3 h-6 w-6 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-700">
                            Start with a layout widget
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-900" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
