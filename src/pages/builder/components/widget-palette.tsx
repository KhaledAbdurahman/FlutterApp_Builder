import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TextInput } from '@mantine/core';
import { getChildSlots } from '@/lib/widgetTreeUtils';
import { WIDGET_DEFINITIONS, type WidgetDefinition } from '@/types/screen-types';
import styles from '@/pages/builder/components/widget-palette.module.css';

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
      className={`${styles.widget} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.widgetIcon}>
        <IconComponent size={16} />
      </div>
      <div className={styles.widgetText}>
        <p>{definition.label}</p>
        <span>{getPlacementLabel(definition)}</span>
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
      <div className={styles.search}>
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search widgets"
          aria-label="Search widgets"
          size="sm"
        />
      </div>

      <div className={styles.list}>
        {PaletteGroups.map(({ category, label, icon: groupIcon }) => {
          const GroupIcon = groupIcon;
          const widgets = WIDGET_DEFINITIONS.filter(
            (widget) => widget.category === category && matchesWidget(widget),
          );

          if (widgets.length === 0) return null;

          return (
            <section key={category} className={styles.group}>
              <div className={styles.groupLabel}>
                <GroupIcon size={14} />
                {label}
              </div>
              <div className={styles.widgets}>
                {widgets.map((widget) => (
                  <DraggableWidget key={widget.type} definition={widget} />
                ))}
              </div>
            </section>
          );
        })}

        {WIDGET_DEFINITIONS.every((widget) => !matchesWidget(widget)) && (
          <p className={styles.empty}>No matching widgets</p>
        )}
      </div>
    </>
  );

  if (embedded) return <div className={styles.embedded}>{content}</div>;

  return <aside className={styles.sidebar}>{content}</aside>;
};

export { WidgetPalette };
