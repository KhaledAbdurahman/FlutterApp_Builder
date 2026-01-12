import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { FlutterWidget } from '@/types/flutter';
import { useBuilderStore } from '@/store/builderStore';
import { cn } from '@/lib/utils';

interface WidgetRendererProps {
  widget: FlutterWidget;
  depth?: number;
}

const WidgetRenderer = ({ widget, depth = 0 }: WidgetRendererProps) => {
  const { selectedWidgetId, setSelectedWidget, isDragging } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${widget.id}`,
    data: { type: 'widget', widgetId: widget.id },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWidget(widget.id);
  };

  const baseClasses = cn(
    "relative transition-all duration-150 cursor-pointer",
    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
    isOver && isDragging && "ring-2 ring-accent ring-dashed",
    "hover:ring-1 hover:ring-primary/50"
  );

  const renderChildren = () => {
    if (!widget.children || widget.children.length === 0) {
      return null;
    }
    return widget.children.map(child => (
      <WidgetRenderer key={child.id} widget={child} depth={depth + 1} />
    ));
  };

  switch (widget.type) {
    case 'Scaffold':
      return (
        <div ref={setNodeRef} onClick={handleClick} className={cn(baseClasses, "flex flex-col h-full bg-white text-gray-900")}>
          {renderChildren()}
        </div>
      );

    case 'AppBar':
      return (
        <div 
          onClick={handleClick}
          className={cn(baseClasses, "h-14 flex items-center px-4")}
          style={{ backgroundColor: widget.props.backgroundColor || '#6200EE' }}
        >
          <span className="text-white font-medium text-lg">{widget.props.title || 'App Bar'}</span>
        </div>
      );

    case 'Container':
      return (
        <div 
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "min-h-[40px]")}
          style={{
            backgroundColor: widget.props.backgroundColor || 'transparent',
            padding: widget.props.padding || 0,
            margin: widget.props.margin || 0,
            borderRadius: widget.props.borderRadius || 0,
            border: widget.props.border ? '1px solid #ccc' : 'none',
          }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case 'Center':
      return (
        <div 
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "flex-1 flex items-center justify-center min-h-[60px]")}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case 'Row':
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

    case 'Column':
      return (
        <div 
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "flex flex-col min-h-[40px] gap-2")}
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

    case 'Stack':
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

    case 'Text':
      return (
        <span 
          onClick={handleClick}
          className={cn(baseClasses, "inline-block")}
          style={{
            fontSize: widget.props.fontSize || 16,
            color: widget.props.color || '#000000',
            fontWeight: widget.props.fontWeight === 'bold' ? 700 : 400,
            textAlign: widget.props.alignment as any || 'left',
          }}
        >
          {widget.props.text || 'Text'}
        </span>
      );

    case 'Button':
      return (
        <button 
          onClick={handleClick}
          className={cn(baseClasses, "px-6 py-2 rounded-md text-white font-medium")}
          style={{ backgroundColor: '#6200EE' }}
        >
          {widget.props.text || 'Button'}
        </button>
      );

    case 'TextField':
      return (
        <input 
          onClick={handleClick}
          type="text"
          placeholder={widget.props.hintText || 'Enter text...'}
          className={cn(baseClasses, "border border-gray-300 rounded-md px-3 py-2 w-full")}
          readOnly
        />
      );

    case 'Icon':
      return (
        <div 
          onClick={handleClick}
          className={cn(baseClasses, "flex items-center justify-center")}
          style={{ 
            width: widget.props.size || 24, 
            height: widget.props.size || 24,
            color: widget.props.color || '#000000',
          }}
        >
          ★
        </div>
      );

    case 'Image':
      return (
        <img 
          onClick={handleClick}
          src={widget.props.src || 'https://via.placeholder.com/150'}
          alt="Widget"
          className={cn(baseClasses, "max-w-full h-auto")}
          style={{ objectFit: widget.props.fit as any || 'cover' }}
        />
      );

    case 'SizedBox':
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

    case 'Padding':
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

    case 'Card':
      return (
        <div 
          ref={setNodeRef}
          onClick={handleClick}
          className={cn(baseClasses, "bg-white rounded-lg p-4 min-h-[60px]")}
          style={{ boxShadow: `0 ${(widget.props.elevation || 2) * 2}px ${(widget.props.elevation || 2) * 4}px rgba(0,0,0,0.1)` }}
        >
          {renderChildren()}
          {(!widget.children || widget.children.length === 0) && (
            <DropZoneIndicator />
          )}
        </div>
      );

    case 'Expanded':
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

    case 'ListView':
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
        <div onClick={handleClick} className={cn(baseClasses, "p-2 bg-gray-100 rounded")}>
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
    case 'start': return 'flex-start';
    case 'end': return 'flex-end';
    case 'center': return 'center';
    case 'spaceBetween': return 'space-between';
    case 'spaceAround': return 'space-around';
    case 'spaceEvenly': return 'space-evenly';
    case 'stretch': return 'stretch';
    case 'baseline': return 'baseline';
    default: return 'flex-start';
  }
};

export const PhoneCanvas = () => {
  const { getActiveScreen, setSelectedWidget, isDragging } = useBuilderStore();
  const screen = getActiveScreen();

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { type: 'canvas' },
  });

  const handleCanvasClick = () => {
    setSelectedWidget(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-canvas overflow-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
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
              isOver && isDragging && "ring-4 ring-primary/50"
            )}
          >
            {/* Status Bar */}
            <div className="h-11 bg-gray-900 flex items-center justify-between px-6 text-white text-xs">
              <span className="ml-auto text-red-400">This is a demo app</span>
            </div>
            
            {/* Content */}
            <div className="h-[calc(100%-2.75rem)] overflow-auto">
              {screen?.components.map(widget => (
                <WidgetRenderer key={widget.id} widget={widget} />
              ))}
              {(!screen?.components || screen.components.length === 0) && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 p-8">
                    <p className="text-lg font-medium mb-2">Empty Screen</p>
                    <p className="text-sm">Drag and drop widgets from the left panel</p>
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
