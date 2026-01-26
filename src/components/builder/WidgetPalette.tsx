import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  WIDGET_DEFINITIONS,
  WidgetType,
  WidgetDefinition,
} from "@/types/screen-types";
import { cn } from "@/lib/utils";

interface DraggableWidgetProps {
  definition: WidgetDefinition;
}

const DraggableWidget = ({ definition }: DraggableWidgetProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { type: "new-widget", widgetType: definition.type },
  });

  const IconComponent =
    (LucideIcons as any)[definition.icon] || LucideIcons.Box;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50 cursor-grab active:cursor-grabbing transition-all",
        "hover:border-primary/50 hover:bg-secondary",
        isDragging && "opacity-50 shadow-glow",
      )}
    >
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <IconComponent className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium">{definition.label}</span>
    </motion.div>
  );
};

export const WidgetPalette = () => {
  const layoutWidgets = WIDGET_DEFINITIONS.filter(
    (w) => w.category === "layout",
  );
  const contentWidgets = WIDGET_DEFINITIONS.filter(
    (w) => w.category === "content",
  );
  const inputWidgets = WIDGET_DEFINITIONS.filter((w) => w.category === "input");
  const navigationWidgets = WIDGET_DEFINITIONS.filter(
    (w) => w.category === "navigation",
  );

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Components
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.LayoutGrid className="w-3 h-3" />
            Layout
          </h3>
          <div className="space-y-2">
            {layoutWidgets.map((widget) => (
              <DraggableWidget key={widget.type} definition={widget} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.FileText className="w-3 h-3" />
            Content
          </h3>
          <div className="space-y-2">
            {contentWidgets.map((widget) => (
              <DraggableWidget key={widget.type} definition={widget} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-success uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.MousePointerClick className="w-3 h-3" />
            Input
          </h3>
          <div className="space-y-2">
            {inputWidgets.map((widget) => (
              <DraggableWidget key={widget.type} definition={widget} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Navigation className="w-3 h-3" />
            Navigation
          </h3>
          <div className="space-y-2">
            {navigationWidgets.map((widget) => (
              <DraggableWidget key={widget.type} definition={widget} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
