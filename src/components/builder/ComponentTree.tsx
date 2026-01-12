import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { FlutterWidget, getWidgetDefinition } from '@/types/flutter';
import { useBuilderStore } from '@/store/builderStore';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface TreeNodeProps {
  widget: FlutterWidget;
  depth?: number;
}

const TreeNode = ({ widget, depth = 0 }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { selectedWidgetId, setSelectedWidget } = useBuilderStore();
  const isSelected = selectedWidgetId === widget.id;
  const hasChildren = widget.children && widget.children.length > 0;
  const definition = getWidgetDefinition(widget.type);
  const IconComponent = definition ? (LucideIcons as any)[definition.icon] || LucideIcons.Box : LucideIcons.Box;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setSelectedWidget(widget.id)}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm",
          isSelected ? "bg-primary/20 text-primary" : "hover:bg-muted text-foreground"
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <IconComponent className="w-4 h-4 text-muted-foreground" />
        <span className="truncate">{widget.type}</span>
        {widget.props.text && (
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            "{widget.props.text}"
          </span>
        )}
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {widget.children!.map(child => (
              <TreeNode key={child.id} widget={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ComponentTree = () => {
  const { getActiveScreen } = useBuilderStore();
  const screen = getActiveScreen();

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Widget Tree
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {screen?.components.map(widget => (
          <TreeNode key={widget.id} widget={widget} />
        ))}
        {(!screen?.components || screen.components.length === 0) && (
          <p className="text-muted-foreground text-sm text-center p-4">
            No widgets yet
          </p>
        )}
      </div>
    </div>
  );
};
