import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { WidgetPalette } from './WidgetPalette';
import { PhoneCanvas } from './PhoneCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { ComponentTree } from './ComponentTree';
import { useBuilderStore } from '@/store/builderStore';
import { WidgetType, getWidgetDefinition } from '@/types/flutter';
import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

export const BuilderLayout = () => {
  const { addWidget, moveWidget, setIsDragging, selectedWidgetId } = useBuilderStore();
  const [activeType, setActiveType] = useState<WidgetType | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const data = event.active.data.current;
    if (data?.type === 'new-widget') {
      setActiveType(data.widgetType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveType(null);
    
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'new-widget') {
      const widgetType = activeData.widgetType as WidgetType;
      
      if (overData?.type === 'widget') {
        addWidget(widgetType, overData.widgetId);
      } else if (overData?.type === 'canvas' || over.id === 'canvas-root') {
        addWidget(widgetType, selectedWidgetId || undefined);
      }
    }
  };

  const definition = activeType ? getWidgetDefinition(activeType) : null;
  const IconComponent = definition ? (LucideIcons as any)[definition.icon] || LucideIcons.Box : LucideIcons.Box;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          <WidgetPalette />
          <ComponentTree />
          <PhoneCanvas />
          <PropertiesPanel />
        </div>
      </div>

      <DragOverlay>
        {activeType && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-card shadow-glow cursor-grabbing"
          >
            <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">{definition?.label}</span>
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
