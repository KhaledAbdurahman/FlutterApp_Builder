import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getChildSlots } from '@/lib/widgetTreeUtils';
import { WIDGET_DEFINITIONS, type WidgetDefinition } from '@/types/screen-types';

interface IWidgetPaletteProps {
  embedded?: boolean;
}

interface IDraggableWidgetProps {
  definition: WidgetDefinition;
}

const isLucideIcon = (icon: unknown): icon is LucideIcon =>
  typeof icon === 'object' && icon !== null && '$$typeof' in icon;

const resolveLucideIcon = (iconName: string): LucideIcon => {
  const icon = LucideIcons[iconName as keyof typeof LucideIcons];
  return isLucideIcon(icon) ? icon : LucideIcons.Box;
};

const getPlacementLabel = (definition: WidgetDefinition): string => {
  const slots = getChildSlots(definition.type);
  if (slots.some((slot) => slot.key === 'itemTemplate')) return 'template';
  if (definition.childConfig.mode === 'none') return 'leaf';
  if (definition.childConfig.mode === 'single') return 'one child';
  return 'children';
};

const PaletteGroups = [
  { category: 'layout', label: 'Layout', icon: LucideIcons.LayoutTemplate },
  { category: 'content', label: 'Content', icon: LucideIcons.Type },
  { category: 'input', label: 'Input', icon: LucideIcons.MousePointerClick },
  { category: 'navigation', label: 'Navigation', icon: LucideIcons.Navigation },
] as const;

const DraggableWidget = ({ definition }: IDraggableWidgetProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { type: 'new-widget', widgetType: definition.type },
  });
  const IconComponent = resolveLucideIcon(definition.icon);

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group flex min-h-12 items-center gap-3 border border-transparent px-2.5 py-2 cursor-grab active:cursor-grabbing',
        'hover:border-border hover:bg-muted/60',
        isDragging && 'border-primary/40 bg-primary/5 opacity-50',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-background text-muted-foreground shadow-sm ring-1 ring-border/70">
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{definition.label}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {getPlacementLabel(definition)}
        </p>
      </div>
    </motion.div>
  );
};

const WidgetPalette = ({ embedded = false }: IWidgetPaletteProps) => {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;
  const matchesWidget = (widget: WidgetDefinition) =>
    !hasSearchQuery ||
    widget.label.toLowerCase().includes(normalizedQuery) ||
    widget.type.toLowerCase().includes(normalizedQuery);

  const content = (
    <>
      <div className="border-b border-border px-3 py-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search widgets"
          aria-label="Search widgets"
          className="h-9 bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {PaletteGroups.map(({ category, label, icon: groupIcon }) => {
          const GroupIcon = groupIcon;
          const widgets = WIDGET_DEFINITIONS.filter(
            (widget) => widget.category === category && matchesWidget(widget),
          );

          if (widgets.length === 0) return null;

          return (
            <section key={category} className="mb-5">
              <div className="flex h-8 items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <GroupIcon className="h-3.5 w-3.5" />
                {label}
              </div>
              <div className="space-y-1">
                {widgets.map((widget) => (
                  <DraggableWidget key={widget.type} definition={widget} />
                ))}
              </div>
            </section>
          );
        })}

        {WIDGET_DEFINITIONS.every((widget) => !matchesWidget(widget)) && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matching widgets</p>
        )}
      </div>
    </>
  );

  if (embedded) return <div className="flex h-full flex-col">{content}</div>;

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">{content}</aside>
  );
};

export { WidgetPalette };
