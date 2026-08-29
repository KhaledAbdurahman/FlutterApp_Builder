import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentPropsByType, FlutterWidget, WidgetType } from '@/types/screen-types';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from '@/pages/builder/components/phone-canvas.module.css';

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
      className={cn(styles.drawerContent, isOver && isDragging && styles.dropTarget)}
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

const getTextDecoration = (decoration?: ComponentPropsByType['Text']['decoration']): string =>
  decoration === 'lineThrough' ? 'line-through' : decoration || 'none';

const getTextOverflowStyles = (
  maxLines: number | undefined,
  overflowMode: NonNullable<ComponentPropsByType['Text']['overflow']>,
): CSSProperties => {
  const hasLineLimit = typeof maxLines === 'number' && maxLines > 0;

  if (!hasLineLimit) return {};

  // CSS line clamping requires hidden overflow, so visible deliberately renders without a clamp.
  if (overflowMode === 'visible') {
    return { display: 'inline-block', overflow: 'visible' };
  }

  const lineClampStyles: CSSProperties = {
    display: '-webkit-box',
    maxWidth: '100%',
    minWidth: 0,
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: maxLines,
    overflow: 'hidden',
  };

  if (overflowMode === 'fade') {
    const fadeMask = 'linear-gradient(to right, #000 calc(100% - 1.5em), transparent)';

    return {
      ...lineClampStyles,
      maskImage: fadeMask,
      WebkitMaskImage: fadeMask,
    };
  }

  return {
    ...lineClampStyles,
    textOverflow: overflowMode,
  };
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
    styles.widget,
    isSelected && styles.widgetSelected,
    isOver && isDragging && styles.dropTarget,
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
        <div key={child.id} className={styles.stackChild}>
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
          className={cn(baseClasses, styles.scaffold)}
          style={{ backgroundColor: widget.props.backgroundColor || '#FFFFFF' }}
        >
          {/* AppBar slot */}
          <div
            ref={setAppBarSlotRef}
            style={{ height: appBarHeight + safeAreaTop }}
            className={cn(styles.scaffoldSlot, isOverAppBarSlot && isDragging && styles.dropTarget)}
          >
            {appBar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(appBar.id);
                }}
                className={cn(
                  styles.scaffoldAppBar,
                  selectedWidgetId === appBar.id && styles.scaffoldAppBarSelected,
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
                    className={styles.appBarIconButton}
                    aria-label="Open navigation drawer"
                  >
                    <MenuIcon className={styles.appBarIcon} />
                  </button>
                )}
                {!drawer && appBar.props.showBackButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={styles.appBarIconButton}
                    aria-label="Back"
                  >
                    <LucideIcons.ArrowLeft className={styles.appBarIcon} />
                  </button>
                )}
                <div
                  className={cn(
                    styles.appBarTitle,
                    appBar.props.centerTitle ? styles.textCentered : styles.textLeft,
                  )}
                >
                  <span
                    className={styles.appBarTitleText}
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
              styles.scaffoldBody,
              bodyControlsOverflow ? styles.scaffoldBodyHidden : styles.scaffoldBodyScrollable,
              isOverBodySlot && isDragging && styles.dropTarget,
            )}
          >
            {body ? (
              <WidgetRenderer
                widget={body}
                depth={depth + 1}
                renderContext={{ isScaffoldBody: true }}
              />
            ) : (
              <div className={styles.scaffoldEmptyBody}>
                <DropZoneIndicator />
              </div>
            )}
          </div>

          {/* BottomNavigationBar slot */}
          <div
            ref={setBottomNavSlotRef}
            style={{ height: bottomNavHeight + safeAreaBottom }}
            className={cn(
              styles.scaffoldSlot,
              isOverBottomNavSlot && isDragging && styles.dropTarget,
            )}
          >
            {bottomNavigationBar && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidget(bottomNavigationBar.id);
                }}
                className={styles.scaffoldBottomNavigation}
              >
                {bottomNavigationBar.props.items && bottomNavigationBar.props.items.length > 0 ? (
                  bottomNavigationBar.props.items.map((item, index) => {
                    const IconComponent = resolveLucideIcon(item.icon);
                    const isActive = (bottomNavigationBar.props.currentIndex ?? 0) === index;
                    return (
                      <div key={`${item.label}-${index}`} className={styles.bottomNavigationItem}>
                        <IconComponent
                          className={styles.bottomNavigationIcon}
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
                  <div className={styles.bottomNavigationEmpty}>
                    <div className={styles.bottomNavigationMutedItem}>
                      {(() => {
                        const HomeIcon = resolveLucideIcon('home');
                        return <HomeIcon className={styles.bottomNavigationIcon} />;
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
                <div className={styles.drawerScrim} onClick={() => setIsDrawerOpen(false)} />
              )}
              <motion.div
                className={styles.drawerPanel}
                initial={{ x: -260 }}
                animate={{ x: isDrawerOpen ? 0 : -260 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <div
                  ref={setDrawerSlotRef}
                  className={cn(
                    styles.drawerPanelContent,
                    isOverDrawerSlot && isDragging && styles.dropTarget,
                  )}
                >
                  <div
                    className={styles.drawerHeader}
                    style={{
                      backgroundColor: drawer.props.header?.backgroundColor || '#6200EE',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWidget(drawer.id);
                    }}
                  >
                    <p className={styles.drawerHeaderTitle}>
                      {drawer.props.header?.title || 'Menu'}
                    </p>
                    {drawer.props.header?.subtitle && (
                      <p className={styles.drawerHeaderSubtitle}>{drawer.props.header.subtitle}</p>
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
          className={cn(baseClasses, styles.standaloneAppBar)}
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
            <LucideIcons.ArrowLeft className={styles.appBarBackIcon} />
          )}
          <span
            className={styles.appBarTitleText}
            style={{ color: widget.props.color || '#FFFFFF' }}
          >
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
          className={cn(baseClasses, styles.container)}
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
            styles.center,
            renderContext?.isScaffoldBody && styles.scaffoldBodyFill,
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
          className={cn(baseClasses, styles.row)}
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
            styles.column,
            renderContext?.isScaffoldBody &&
              widget.props.mainAxisSize !== 'min' &&
              styles.scaffoldColumn,
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
            styles.stack,
            renderContext?.isScaffoldBody && styles.scaffoldStack,
          )}
        >
          {renderStackChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator label="Drop stacked children" />
          )}
        </div>
      );

    case 'Text': {
      const overflowMode = widget.props.overflow ?? 'visible';

      return (
        <span
          onClick={handleClick}
          className={cn(baseClasses, styles.textWidget)}
          style={{
            fontSize: widget.props.fontSize || 16,
            color: widget.props.color || '#000000',
            fontWeight: widget.props.fontWeight === 'bold' ? 700 : 400,
            textAlign: alignmentToTextAlign(widget.props.alignment),
            fontStyle: widget.props.fontStyle || 'normal',
            letterSpacing: widget.props.letterSpacing ?? 0,
            textDecoration: getTextDecoration(widget.props.decoration),
            ...getTextOverflowStyles(widget.props.maxLines, overflowMode),
          }}
        >
          {widget.props.text || 'Text'}
        </span>
      );
    }

    case 'Button':
      return (
        <button
          onClick={handleClick}
          className={cn(baseClasses, styles.buttonWidget)}
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
          className={cn(baseClasses, styles.textFieldWidget)}
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
          className={cn(baseClasses, styles.iconWidget)}
          style={{
            width: widget.props.size || 24,
            height: widget.props.size || 24,
            color: widget.props.color || '#000000',
          }}
        >
          <IconComponent className={styles.iconWidgetGraphic} />
        </div>
      );
    }
    case 'Drawer':
      return (
        <div
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, styles.drawerWidget)}
        >
          <div
            className={styles.drawerWidgetHeader}
            style={{
              backgroundColor: widget.props.header?.backgroundColor || '#6200EE',
            }}
          >
            <p className={styles.drawerHeaderTitle}>{widget.props.header?.title || 'Menu'}</p>
            {widget.props.header?.subtitle && (
              <p className={styles.drawerHeaderSubtitle}>{widget.props.header.subtitle}</p>
            )}
          </div>
          <div className={styles.drawerWidgetContent}>
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
        <div onClick={handleClick} className={cn(baseClasses, styles.listTile)}>
          <div className={styles.listTileIconContainer}>
            <IconComponent className={styles.listTileIcon} />
          </div>
          <div className={styles.listTileContent}>
            <p className={styles.listTileTitle}>{widget.props.title || 'List Item'}</p>
            {widget.props.actions?.route && (
              <p className={styles.listTileRoute}>{widget.props.actions.route}</p>
            )}
          </div>
          <LucideIcons.ChevronRight className={styles.listTileChevron} />
        </div>
      );
    }
    case 'BottomNavigationBar':
      return (
        <div
          onClick={handleClick}
          className={cn(baseClasses, styles.bottomNavigation)}
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
                <div key={`${item.label}-${index}`} className={styles.bottomNavigationItem}>
                  <IconComponent className={styles.bottomNavigationIcon} style={{ color }} />
                  <span style={{ color }}>{item.label}</span>
                </div>
              );
            })
          ) : (
            <div className={styles.bottomNavigationEmpty}>
              <div className={styles.bottomNavigationMutedItem}>
                {(() => {
                  const HomeIcon = resolveLucideIcon('home');
                  return <HomeIcon className={styles.bottomNavigationIcon} />;
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
          className={cn(baseClasses, styles.imageWidget)}
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
            styles.sizedBox,
            (!widget.children || widget.children.length === 0) && styles.sizedBoxEmpty,
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
          className={cn(baseClasses, styles.card)}
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
          className={cn(baseClasses, styles.expanded)}
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
            styles.listView,
            renderContext?.isScaffoldBody && !widget.props.shrinkWrap && styles.scaffoldBodyFill,
          )}
          style={{
            padding: widget.props.padding ?? 0,
          }}
        >
          {(() => {
            const explicitCount = widget.props.itemCount ?? 0;
            const count = explicitCount > 0 ? explicitCount : 3;

            const itemTemplate = widget.itemTemplate;

            if (itemTemplate) {
              return Array.from({ length: count }).map((_, i) => (
                <WidgetRenderer
                  key={`${itemTemplate.id}-${i}`}
                  widget={{
                    ...itemTemplate,
                    id: `${itemTemplate.id}-${i}`,
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
          className={cn(baseClasses, styles.positioned)}
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
    className={cn(styles.dropZone, compact ? styles.dropZoneCompact : styles.dropZoneDefault)}
    aria-label={label}
    title={label}
  >
    <LucideIcons.Plus size={compact ? 12 : 16} className={styles.dropZoneIcon} />
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
    <div className={styles.canvas}>
      <div className={styles.canvasToolbar}>
        <div className={styles.deviceSummary}>
          <LucideIcons.Smartphone size={16} />
          <span className={styles.deviceName}>Pixel 8</span>
          <span>6.2 in</span>
          <span className={styles.deviceResolution}>1080 x 2400</span>
        </div>

        <div className={styles.zoomControls}>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() =>
              setZoom((currentZoom) => Math.max(MINIMUM_ZOOM, currentZoom - ZOOM_STEP))
            }
            disabled={zoom <= MINIMUM_ZOOM}
            aria-label="Zoom out"
          >
            <LucideIcons.Minus size={16} />
          </button>
          <span className={styles.zoomValue}>{zoom}%</span>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() =>
              setZoom((currentZoom) => Math.min(MAXIMUM_ZOOM, currentZoom + ZOOM_STEP))
            }
            disabled={zoom >= MAXIMUM_ZOOM}
            aria-label="Zoom in"
          >
            <LucideIcons.Plus size={16} />
          </button>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => setZoom(DEFAULT_ZOOM)}
            aria-label="Reset zoom"
          >
            <LucideIcons.RotateCcw size={14} />
          </button>
        </div>

        <div className={styles.selectedWidget}>
          {selectedWidget ? selectedWidget.type : 'Select a widget'}
        </div>
      </div>

      <div className={styles.canvasViewport}>
        <div
          className={styles.canvasGrid}
          style={{
            minWidth: scaledFrameWidth + 80,
            minHeight: scaledFrameHeight + 80,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={styles.scaledFrame}
            style={{ width: scaledFrameWidth, height: scaledFrameHeight }}
          >
            <div
              className={styles.frameScaler}
              style={{
                width: PIXEL_FRAME_WIDTH,
                height: PIXEL_FRAME_HEIGHT,
                transform: `scale(${zoomScale})`,
              }}
            >
              <div
                className={styles.deviceFrame}
                style={{ width: PIXEL_FRAME_WIDTH, height: PIXEL_FRAME_HEIGHT }}
              >
                <div className={styles.deviceCamera} />
                <div
                  ref={setNodeRef}
                  onClick={handleCanvasClick}
                  className={cn(
                    styles.deviceViewport,
                    isOver && isDragging && styles.deviceViewportOver,
                  )}
                >
                  <div className={styles.deviceStatusBar}>
                    <span>9:41</span>
                    <div className={styles.statusIcons}>
                      <LucideIcons.Signal size={12} />
                      <LucideIcons.Wifi size={12} />
                      <LucideIcons.BatteryMedium size={14} />
                    </div>
                  </div>

                  <div className={styles.deviceContent}>
                    {screen?.components.map((widget) => (
                      <WidgetRenderer key={widget.id} widget={widget} />
                    ))}
                    {(!screen?.components || screen.components.length === 0) && (
                      <div className={styles.emptyCanvas}>
                        <div className={styles.emptyCanvasCard}>
                          <LucideIcons.LayoutTemplate
                            size={24}
                            className={styles.emptyCanvasIcon}
                          />
                          <p>Start with a layout widget</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.deviceHomeIndicator} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
