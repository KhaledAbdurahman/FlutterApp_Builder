import { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TextInput } from '@mantine/core';
import { getChildSlots } from '@/lib/widgetTreeUtils';
import { useComponentCatalog } from '@/pages/builder/hooks/use-component-catalog';
import type { IComponentChildRule } from '@/types/api/component-types';
import {
  DEFAULT_COMPONENT_PROPS,
  WIDGET_DEFINITIONS,
  type WidgetDefinition,
} from '@/types/screen-types';
import styles from '@/pages/builder/components/widget-palette.module.css';

interface IWidgetPaletteProps {
  embedded?: boolean;
}

interface IDraggableWidgetProps {
  definition: WidgetDefinition;
  childRule?: IComponentChildRule;
  propertyNames: string[];
}

const isLucideIcon = (icon: unknown): icon is LucideIcon =>
  typeof icon === 'object' && icon !== null && '$$typeof' in icon;

const resolveLucideIcon = (iconName: string): LucideIcon => {
  const icon = LucideIcons[iconName as keyof typeof LucideIcons];
  return isLucideIcon(icon) ? icon : LucideIcons.Box;
};

const getPlacementLabel = (
  definition: WidgetDefinition,
  childRule?: IComponentChildRule,
): string => {
  if (childRule === 'none') return 'leaf';
  if (childRule === 'child') return 'one child';
  if (childRule === 'children') return 'children';
  if (childRule === 'special') return 'special slots';

  const slots = getChildSlots(definition.type);
  if (slots.some((slot) => slot.key === 'itemTemplate')) return 'template';
  if (definition.childConfig.mode === 'none') return 'leaf';
  if (definition.childConfig.mode === 'single') return 'one child';
  return 'children';
};

const PaletteGroupDetails = {
  layout: { label: 'Layout', icon: LucideIcons.LayoutTemplate },
  content: { label: 'Content', icon: LucideIcons.Type },
  input: { label: 'Input', icon: LucideIcons.MousePointerClick },
  navigation: { label: 'Navigation', icon: LucideIcons.Navigation },
  screen: { label: 'Screen', icon: LucideIcons.PanelsTopLeft },
} as const;

const FALLBACK_CATEGORY_ORDER = ['layout', 'content', 'input', 'navigation'];

const DraggableWidget = ({ definition, childRule, propertyNames }: IDraggableWidgetProps) => {
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
      title={propertyNames.length > 0 ? `Properties: ${propertyNames.join(', ')}` : undefined}
    >
      <div className={styles.widgetIcon}>
        <IconComponent size={16} />
      </div>
      <div className={styles.widgetText}>
        <p>{definition.label}</p>
        <span>
          {getPlacementLabel(definition, childRule)}, {propertyNames.length} props
        </span>
      </div>
    </motion.div>
  );
};

const WidgetPalette = ({ embedded = false }: IWidgetPaletteProps) => {
  const [query, setQuery] = useState('');
  const { availableComponents, categories } = useComponentCatalog();
  const normalizedQuery = query.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;
  const matchesWidget = (widget: WidgetDefinition) =>
    !hasSearchQuery ||
    widget.label.toLowerCase().includes(normalizedQuery) ||
    widget.type.toLowerCase().includes(normalizedQuery);
  const catalogItems = useMemo(() => {
    if (!availableComponents) {
      return WIDGET_DEFINITIONS.map((definition) => ({
        definition,
        category: definition.category,
        childRule: undefined,
        propertyNames: Object.keys(DEFAULT_COMPONENT_PROPS[definition.type]),
      }));
    }

    return availableComponents.flatMap((component) => {
      const definition = WIDGET_DEFINITIONS.find(({ type }) => type === component.type);
      if (!definition) return [];

      return [
        {
          definition,
          category: component.category,
          childRule: component.child_rule,
          propertyNames: component.props.map(({ name }) => name),
        },
      ];
    });
  }, [availableComponents]);
  const categoryOrder = useMemo(() => {
    if (!availableComponents) return FALLBACK_CATEGORY_ORDER;

    const catalogCategories = categories ?? catalogItems.map(({ category }) => category);
    return [...new Set([...catalogCategories, ...catalogItems.map(({ category }) => category)])];
  }, [availableComponents, catalogItems, categories]);

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
        {categoryOrder.map((category) => {
          const groupDetails = PaletteGroupDetails[
            category as keyof typeof PaletteGroupDetails
          ] ?? {
            label: category,
            icon: LucideIcons.Boxes,
          };
          const GroupIcon = groupDetails.icon;
          const widgets = catalogItems.filter(
            ({ definition, category: widgetCategory }) =>
              widgetCategory === category && matchesWidget(definition),
          );

          if (widgets.length === 0) return null;

          return (
            <section key={category} className={styles.group}>
              <div className={styles.groupLabel}>
                <GroupIcon size={14} />
                {groupDetails.label}
              </div>
              <div className={styles.widgets}>
                {widgets.map(({ definition, childRule, propertyNames }) => (
                  <DraggableWidget
                    key={definition.type}
                    definition={definition}
                    childRule={childRule}
                    propertyNames={propertyNames}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {catalogItems.every(({ definition }) => !matchesWidget(definition)) && (
          <p className={styles.empty}>No matching widgets</p>
        )}
      </div>
    </>
  );

  if (embedded) return <div className={styles.embedded}>{content}</div>;

  return <aside className={styles.sidebar}>{content}</aside>;
};

export { WidgetPalette };
