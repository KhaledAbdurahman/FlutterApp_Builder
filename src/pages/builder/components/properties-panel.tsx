import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, X } from 'lucide-react';
import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';
import {
  ActionIcon,
  Button,
  Divider,
  Select as MantineSelect,
  Switch as MantineSwitch,
  Text,
  TextInput,
} from '@mantine/core';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import { getWidgetDefinition } from '@/types/screen-types';
import type {
  ActionBase,
  BottomNavItem,
  ComponentPropsByType,
  ComponentType,
  DrawerHeader,
} from '@/types/screen-types';
import { ChooseNotification } from '@/lib/choose-notification';
import styles from '@/pages/builder/components/properties-panel.module.css';

const CreateActionForType = (actionType: ActionBase['type'], defaultRoute: string): ActionBase => {
  switch (actionType) {
    case 'snackbar':
      return { type: 'snackbar', message: 'Action triggered!' };
    case 'dialog':
      return { type: 'dialog', title: 'Dialog', message: 'Action triggered!' };
    case 'navigate':
      return { type: 'navigate', route: defaultRoute };
    case 'goBack':
      return { type: 'goBack' };
  }
};

const DEFAULT_DRAWER_HEADER: DrawerHeader = {
  title: 'Menu',
  subtitle: 'Welcome',
  backgroundColor: '#6200EE',
};

// Drawer headers are edited field by field, so complete the required Flutter values before merging one field.
const getDrawerHeader = (header?: DrawerHeader): DrawerHeader => ({
  ...DEFAULT_DRAWER_HEADER,
  ...header,
});

interface IPropertySwitchProps extends Omit<ComponentProps<typeof MantineSwitch>, 'onChange'> {
  onCheckedChange: (checked: boolean) => void;
}

interface IPropertySelectProps {
  children: ReactNode;
  onValueChange: (value: string) => void;
  value: string;
}

interface IPropertySelectItemProps {
  children: ReactNode;
  value: string;
}

interface IPropertySelectTriggerProps {
  children: ReactNode;
  className?: string;
}

interface IPropertySelectValueProps {
  placeholder?: string;
}

interface IPropertySelectDefinition {
  className?: string;
  data: Array<{ label: string; value: string }>;
  placeholder?: string;
}

const PropertySwitch = ({ onCheckedChange, ...props }: IPropertySwitchProps) => (
  <MantineSwitch {...props} onChange={(event) => onCheckedChange(event.currentTarget.checked)} />
);

const PropertySelectItem = (_props: IPropertySelectItemProps) => null;
const PropertySelectContent = (_props: { children: ReactNode }) => null;
const PropertySelectTrigger = (_props: IPropertySelectTriggerProps) => null;
const PropertySelectValue = (_props: IPropertySelectValueProps) => null;

const getTextContent = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? child : ''))
    .join('');

const getPropertySelectDefinition = (children: ReactNode): IPropertySelectDefinition => {
  const definition: IPropertySelectDefinition = { data: [] };

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === PropertySelectItem) {
        const { children: itemChildren, value } = child.props as IPropertySelectItemProps;
        definition.data.push({ label: getTextContent(itemChildren), value });
      }

      if (child.type === PropertySelectTrigger) {
        const { className } = child.props as IPropertySelectTriggerProps;
        definition.className = className;
      }

      if (child.type === PropertySelectValue) {
        const { placeholder } = child.props as IPropertySelectValueProps;
        definition.placeholder = placeholder;
      }

      const { children: nestedChildren } = child.props as { children?: ReactNode };
      if (nestedChildren) visit(nestedChildren);
    });
  };

  visit(children);
  return definition;
};

// Widget-specific options stay beside their fields; this adapter keeps that schema readable while Mantine owns the control.
const PropertySelect = ({ children, onValueChange, value }: IPropertySelectProps) => {
  const { className, data, placeholder } = getPropertySelectDefinition(children);

  return (
    <MantineSelect
      allowDeselect={false}
      className={className}
      data={data}
      placeholder={placeholder}
      value={value || null}
      onChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue);
      }}
    />
  );
};

export const PropertiesPanel = () => {
  const { selectedWidgetId, getWidgetById, updateWidgetProps, deleteWidget, project } =
    useBuilderStore();
  const widget = selectedWidgetId ? getWidgetById(selectedWidgetId) : null;
  const definition = widget ? getWidgetDefinition(widget.type) : null;
  const drawerHeader =
    widget?.type === 'Drawer' ? getDrawerHeader(widget.props.header) : DEFAULT_DRAWER_HEADER;

  const handleDelete = () => {
    if (selectedWidgetId) {
      deleteWidget(selectedWidgetId);
      ChooseNotification.success({ message: 'Widget deleted' });
    }
  };

  const screenOptions = project.screens.map((screen) => ({
    id: screen.id,
    name: screen.name,
    route: screen.route,
  }));
  const defaultRoute =
    project.screens.find((screen) => screen.is_home)?.route ?? screenOptions[0]?.route ?? '/';

  const addAction = () => {
    if (!widget || widget.type !== 'Button') return;
    const currentActions = widget.props.actions || [];
    const newAction: ActionBase = {
      type: 'snackbar',
      message: 'Action triggered!',
    };
    updateWidgetProps(widget.id, { actions: [...currentActions, newAction] });
  };

  const updateAction = (index: number, updates: Partial<ActionBase>) => {
    if (!widget || widget.type !== 'Button') return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions[index] = {
      ...(currentActions[index] as ActionBase),
      ...(updates as ActionBase),
    } as ActionBase;
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  const replaceActionType = (index: number, actionType: ActionBase['type']) => {
    if (!widget || widget.type !== 'Button') return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions[index] = CreateActionForType(actionType, defaultRoute);
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  const removeAction = (index: number) => {
    if (!widget || widget.type !== 'Button') return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions.splice(index, 1);
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  // BottomNavigationBar item helpers
  const addNavItem = () => {
    if (!widget || widget.type !== 'BottomNavigationBar') return;
    const currentItems = widget.props.items || [];
    const newItem: BottomNavItem = {
      label: 'New Tab',
      icon: 'home',
      route: defaultRoute,
    };
    updateWidgetProps(widget.id, { items: [...currentItems, newItem] });
  };

  const updateNavItem = (index: number, updates: Partial<BottomNavItem>) => {
    if (!widget || widget.type !== 'BottomNavigationBar') return;
    const currentItems = [...(widget.props.items || [])];
    currentItems[index] = { ...currentItems[index], ...updates };
    updateWidgetProps(widget.id, { items: currentItems });
  };

  const updateContainerLayout = (dimension: 'w' | 'h', rawValue: string): void => {
    if (!widget || widget.type !== 'Container') return;

    const layout: NonNullable<ComponentPropsByType['Container']['layout']> = {
      w: widget.props.layout?.w ?? 0,
      h: widget.props.layout?.h ?? 0,
      [dimension]: rawValue ? Number.parseInt(rawValue, 10) : 0,
    };
    const containerProps = { layout } satisfies Partial<ComponentPropsByType['Container']>;

    updateWidgetProps(widget.id, containerProps as Partial<ComponentPropsByType[ComponentType]>);
  };

  const removeNavItem = (index: number) => {
    if (!widget || widget.type !== 'BottomNavigationBar') return;
    const currentItems = [...(widget.props.items || [])];
    currentItems.splice(index, 1);
    updateWidgetProps(widget.id, { items: currentItems });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Properties</h2>
      </div>

      <AnimatePresence mode="wait">
        {widget ? (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={styles.content}
          >
            <div className={styles.contentInner}>
              <div className={styles.row}>
                <div className={styles.inlineControl}>
                  <div className={styles.widgetBadge}>
                    <span className={styles.widgetBadgeText}>{widget.type.charAt(0)}</span>
                  </div>
                  <div>
                    <p className={styles.widgetName}>{widget.type}</p>
                    <p className={styles.mutedText}>Widget</p>
                  </div>
                </div>
                <ActionIcon
                  aria-label="Delete selected widget"
                  size="lg"
                  variant="subtle"
                  onClick={handleDelete}
                  className={styles.deleteButton}
                >
                  <Trash2 className={styles.deleteIcon} />
                </ActionIcon>
              </div>

              <Divider />

              {/* Text Widget Props */}
              {widget.type === 'Text' && (
                <div className={styles.section}>
                  <PropertyField label="Text">
                    <TextInput
                      value={widget.props.text || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { text: e.target.value })}
                      placeholder="Enter text..."
                    />
                  </PropertyField>
                  <PropertyField label="Font Size">
                    <TextInput
                      type="number"
                      value={widget.props.fontSize || 16}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          fontSize: parseInt(e.target.value) || 16,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Font Weight">
                    <PropertySelect
                      value={widget.props.fontWeight || 'normal'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          fontWeight: v as 'normal' | 'bold',
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="normal">Normal</PropertySelectItem>
                        <PropertySelectItem value="bold">Bold</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Font Style">
                    <PropertySelect
                      value={widget.props.fontStyle || 'normal'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          fontStyle: v as 'normal' | 'italic',
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="normal">Normal</PropertySelectItem>
                        <PropertySelectItem value="italic">Italic</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Text Decoration">
                    <PropertySelect
                      value={widget.props.decoration || 'none'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          decoration: v as ComponentPropsByType['Text']['decoration'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="none">None</PropertySelectItem>
                        <PropertySelectItem value="underline">Underline</PropertySelectItem>
                        <PropertySelectItem value="overline">Overline</PropertySelectItem>
                        <PropertySelectItem value="lineThrough">Line Through</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Letter Spacing">
                    <TextInput
                      type="number"
                      step="0.1"
                      value={widget.props.letterSpacing ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          letterSpacing: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <PropertyField label="Max Lines">
                    <TextInput
                      type="number"
                      value={widget.props.maxLines ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          maxLines: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </PropertyField>
                  <PropertyField label="Overflow">
                    <PropertySelect
                      value={widget.props.overflow || 'visible'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          overflow: v as ComponentPropsByType['Text']['overflow'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="visible">Visible</PropertySelectItem>
                        <PropertySelectItem value="clip">Clip</PropertySelectItem>
                        <PropertySelectItem value="fade">Fade</PropertySelectItem>
                        <PropertySelectItem value="ellipsis">Ellipsis</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Alignment">
                    <PropertySelect
                      value={widget.props.alignment || 'left'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          alignment: v as ComponentPropsByType['Text']['alignment'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="left">Left</PropertySelectItem>
                        <PropertySelectItem value="center">Center</PropertySelectItem>
                        <PropertySelectItem value="right">Right</PropertySelectItem>
                        <PropertySelectItem value="justify">Justify</PropertySelectItem>
                        <PropertySelectItem value="start">Start</PropertySelectItem>
                        <PropertySelectItem value="end">End</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Color">
                    <TextInput
                      type="color"
                      value={widget.props.color || '#000000'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className={styles.colorInput}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Button Widget Props */}
              {widget.type === 'Button' && (
                <div className={styles.section}>
                  <PropertyField label="Button Text">
                    <TextInput
                      value={widget.props.text || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { text: e.target.value })}
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <TextInput
                      type="color"
                      value={widget.props.backgroundColor || '#6200EE'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Text Color">
                    <TextInput
                      type="color"
                      value={widget.props.color || '#FFFFFF'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Elevation">
                    <TextInput
                      type="number"
                      value={widget.props.elevation ?? 2}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          elevation: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Border Radius">
                    <TextInput
                      type="number"
                      value={widget.props.borderRadius ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          borderRadius: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>

                  <Divider />

                  <div className={styles.stackCompact}>
                    <div className={styles.row}>
                      <Text component="span" className={styles.mutedText}>
                        Actions
                      </Text>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={addAction}
                        className={styles.addButton}
                      >
                        <Plus className={styles.addIcon} /> Add
                      </Button>
                    </div>

                    {(widget.props.actions || []).map((action, index) => (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.row}>
                          <PropertySelect
                            value={action.type}
                            onValueChange={(value) =>
                              replaceActionType(index, value as ActionBase['type'])
                            }
                          >
                            <PropertySelectTrigger className={styles.compactField}>
                              <PropertySelectValue />
                            </PropertySelectTrigger>
                            <PropertySelectContent>
                              <PropertySelectItem value="snackbar">Snackbar</PropertySelectItem>
                              <PropertySelectItem value="dialog">Dialog</PropertySelectItem>
                              <PropertySelectItem value="navigate">Navigate</PropertySelectItem>
                              <PropertySelectItem value="goBack">Go Back</PropertySelectItem>
                            </PropertySelectContent>
                          </PropertySelect>
                          <ActionIcon
                            aria-label={`Remove action ${index + 1}`}
                            size="sm"
                            variant="subtle"
                            onClick={() => removeAction(index)}
                            className={styles.removeButton}
                          >
                            <X className={styles.removeIcon} />
                          </ActionIcon>
                        </div>

                        {action.type === 'snackbar' && (
                          <TextInput
                            value={action.message || ''}
                            onChange={(e) => updateAction(index, { message: e.target.value })}
                            placeholder="Message..."
                            className={styles.compactField}
                          />
                        )}

                        {action.type === 'dialog' && (
                          <>
                            <TextInput
                              value={action.title || ''}
                              onChange={(e) => updateAction(index, { title: e.target.value })}
                              placeholder="Dialog Title..."
                              className={styles.compactField}
                            />
                            <TextInput
                              value={action.message || ''}
                              onChange={(e) => updateAction(index, { message: e.target.value })}
                              placeholder="Dialog Message..."
                              className={styles.compactField}
                            />
                          </>
                        )}

                        {action.type === 'navigate' && (
                          <PropertySelect
                            value={action.route || ''}
                            onValueChange={(v) => updateAction(index, { route: v })}
                          >
                            <PropertySelectTrigger className={styles.compactField}>
                              <PropertySelectValue placeholder="Select route..." />
                            </PropertySelectTrigger>
                            <PropertySelectContent>
                              {screenOptions.map((screen) => (
                                <PropertySelectItem key={screen.id} value={screen.route}>
                                  {screen.name} ({screen.route})
                                </PropertySelectItem>
                              ))}
                            </PropertySelectContent>
                          </PropertySelect>
                        )}
                      </div>
                    ))}

                    {(!widget.props.actions || widget.props.actions.length === 0) && (
                      <p className={styles.emptyCollection}>No actions added yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* AppBar Widget Props */}
              {widget.type === 'AppBar' && (
                <div className={styles.section}>
                  <PropertyField label="Title">
                    <TextInput
                      value={widget.props.title || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { title: e.target.value })}
                    />
                  </PropertyField>
                  <PropertyField label="Title Color">
                    <TextInput
                      type="color"
                      value={widget.props.color || '#FFFFFF'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          color: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <TextInput
                      type="color"
                      value={widget.props.backgroundColor || '#6200EE'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Elevation">
                    <TextInput
                      type="number"
                      value={widget.props.elevation || 4}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          elevation: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Center Title">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.centerTitle ?? true}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { centerTitle: checked })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.centerTitle !== false ? 'Centered' : 'Left-aligned'}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Show Back Button">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.showBackButton || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, {
                            showBackButton: checked,
                          })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.showBackButton ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Auto Imply Leading">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.automaticallyImplyLeading !== false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, {
                            automaticallyImplyLeading: checked,
                          })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.automaticallyImplyLeading !== false ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                  </PropertyField>
                </div>
              )}

              {/* Container Widget Props */}
              {widget.type === 'Container' && (
                <div className={styles.section}>
                  <PropertyField label="Width">
                    <TextInput
                      type="number"
                      value={widget.props.layout?.w || ''}
                      onChange={(e) => updateContainerLayout('w', e.target.value)}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <TextInput
                      type="number"
                      value={widget.props.layout?.h || ''}
                      onChange={(e) => updateContainerLayout('h', e.target.value)}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Padding">
                    <TextInput
                      type="number"
                      value={widget.props.padding || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          padding: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Margin">
                    <TextInput
                      type="number"
                      value={widget.props.margin || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          margin: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Border Radius">
                    <TextInput
                      type="number"
                      value={widget.props.borderRadius || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          borderRadius: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <TextInput
                      type="color"
                      value={widget.props.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Border">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.border || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { border: checked })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.border ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </PropertyField>
                  {widget.props.border && (
                    <>
                      <PropertyField label="Border Color">
                        <TextInput
                          type="color"
                          value={widget.props.borderColor || '#000000'}
                          onChange={(e) =>
                            updateWidgetProps(widget.id, {
                              borderColor: e.target.value,
                            })
                          }
                          className={styles.colorInput}
                        />
                      </PropertyField>
                      <PropertyField label="Border Width">
                        <TextInput
                          type="number"
                          value={widget.props.borderWidth || 1}
                          onChange={(e) =>
                            updateWidgetProps(widget.id, {
                              borderWidth: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </PropertyField>
                    </>
                  )}
                </div>
              )}

              {/* Row/Column Widget Props */}
              {(widget.type === 'Row' || widget.type === 'Column') && (
                <div className={styles.section}>
                  <PropertyField label="Main Axis Alignment">
                    <PropertySelect
                      value={widget.props.mainAxisAlignment || 'start'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          mainAxisAlignment: v as ComponentPropsByType['Row']['mainAxisAlignment'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="start">Start</PropertySelectItem>
                        <PropertySelectItem value="end">End</PropertySelectItem>
                        <PropertySelectItem value="center">Center</PropertySelectItem>
                        <PropertySelectItem value="spaceBetween">Space Between</PropertySelectItem>
                        <PropertySelectItem value="spaceAround">Space Around</PropertySelectItem>
                        <PropertySelectItem value="spaceEvenly">Space Evenly</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Cross Axis Alignment">
                    <PropertySelect
                      value={widget.props.crossAxisAlignment || 'center'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          crossAxisAlignment:
                            v as ComponentPropsByType['Row']['crossAxisAlignment'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="start">Start</PropertySelectItem>
                        <PropertySelectItem value="end">End</PropertySelectItem>
                        <PropertySelectItem value="center">Center</PropertySelectItem>
                        <PropertySelectItem value="stretch">Stretch</PropertySelectItem>
                        <PropertySelectItem value="baseline">Baseline</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Main Axis Size">
                    <PropertySelect
                      value={widget.props.mainAxisSize || 'max'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          mainAxisSize: v as 'min' | 'max',
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="max">
                          Max (Fill available space)
                        </PropertySelectItem>
                        <PropertySelectItem value="min">Min (Fit content)</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                </div>
              )}

              {/* Positioned Widget Props */}
              {widget.type === 'Positioned' && (
                <div className={styles.section}>
                  <PropertyField label="Top">
                    <TextInput
                      type="number"
                      value={widget.props.top ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          top: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Bottom">
                    <TextInput
                      type="number"
                      value={widget.props.bottom ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          bottom: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Left">
                    <TextInput
                      type="number"
                      value={widget.props.left ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          left: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Right">
                    <TextInput
                      type="number"
                      value={widget.props.right ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          right: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Width">
                    <TextInput
                      type="number"
                      value={widget.props.width ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          width: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <TextInput
                      type="number"
                      value={widget.props.height ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          height: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                </div>
              )}

              {/* SizedBox Widget Props */}
              {widget.type === 'SizedBox' && (
                <div className={styles.section}>
                  <PropertyField label="Width">
                    <TextInput
                      type="number"
                      value={widget.props.width || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          width: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <TextInput
                      type="number"
                      value={widget.props.height || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          height: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </PropertyField>
                </div>
              )}

              {/* TextField Widget Props */}
              {widget.type === 'TextField' && (
                <div className={styles.section}>
                  <PropertyField label="Hint Text">
                    <TextInput
                      value={widget.props.hintText || ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          hintText: e.target.value,
                        })
                      }
                      placeholder="Placeholder text..."
                    />
                  </PropertyField>
                  <PropertyField label="Label Text">
                    <TextInput
                      value={widget.props.labelText || ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          labelText: e.target.value,
                        })
                      }
                      placeholder="Field label..."
                    />
                  </PropertyField>
                  <PropertyField label="Keyboard Type">
                    <PropertySelect
                      value={widget.props.keyboardType || 'text'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          keyboardType: v as ComponentPropsByType['TextField']['keyboardType'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="text">Text</PropertySelectItem>
                        <PropertySelectItem value="number">Number</PropertySelectItem>
                        <PropertySelectItem value="email">Email</PropertySelectItem>
                        <PropertySelectItem value="phone">Phone</PropertySelectItem>
                        <PropertySelectItem value="url">URL</PropertySelectItem>
                        <PropertySelectItem value="multiline">Multiline</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Obscure Text (Password)">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.obscureText || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { obscureText: checked })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.obscureText ? 'Hidden' : 'Visible'}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Border">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.border !== false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { border: checked })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.border !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Prefix Icon">
                    <TextInput
                      value={widget.props.prefixIcon || ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          prefixIcon: e.target.value,
                        })
                      }
                      placeholder="e.g., email, lock, person"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Icon Widget Props */}
              {widget.type === 'Icon' && (
                <div className={styles.section}>
                  <PropertyField label="Icon Name">
                    <TextInput
                      value={widget.props.icon || 'star'}
                      onChange={(e) => updateWidgetProps(widget.id, { icon: e.target.value })}
                      placeholder="e.g., star, home, person, arrow_forward_ios"
                    />
                  </PropertyField>
                  <PropertyField label="Size">
                    <TextInput
                      type="number"
                      value={widget.props.size || 24}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          size: parseInt(e.target.value) || 24,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Color">
                    <TextInput
                      type="color"
                      value={widget.props.color || '#000000'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className={styles.colorInput}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Image Widget Props */}
              {widget.type === 'Image' && (
                <div className={styles.section}>
                  <PropertyField label="Image URL">
                    <TextInput
                      value={widget.props.src || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { src: e.target.value })}
                      placeholder="https://... or asset path"
                    />
                  </PropertyField>
                  <PropertyField label="Fit">
                    <PropertySelect
                      value={widget.props.fit || 'cover'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          fit: v as ComponentPropsByType['Image']['fit'],
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="cover">Cover</PropertySelectItem>
                        <PropertySelectItem value="contain">Contain</PropertySelectItem>
                        <PropertySelectItem value="fill">Fill</PropertySelectItem>
                        <PropertySelectItem value="fitWidth">Fit Width</PropertySelectItem>
                        <PropertySelectItem value="fitHeight">Fit Height</PropertySelectItem>
                        <PropertySelectItem value="scaleDown">Scale Down</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Width">
                    <TextInput
                      type="number"
                      value={widget.props.width ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          width: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <TextInput
                      type="number"
                      value={widget.props.height ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          height: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Padding Widget Props */}
              {widget.type === 'Padding' && (
                <div className={styles.section}>
                  <PropertyField label="Padding">
                    <TextInput
                      type="number"
                      value={widget.props.all || 8}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          all: parseInt(e.target.value) || 8,
                        })
                      }
                    />
                  </PropertyField>
                </div>
              )}

              {/* Card Widget Props */}
              {widget.type === 'Card' && (
                <div className={styles.section}>
                  <PropertyField label="Elevation">
                    <TextInput
                      type="number"
                      value={widget.props.elevation || 1}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          elevation: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Color">
                    <TextInput
                      type="color"
                      value={widget.props.color || '#ffffff'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Margin">
                    <TextInput
                      type="number"
                      value={widget.props.margin ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          margin: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <PropertyField label="Border Radius">
                    <TextInput
                      type="number"
                      value={widget.props.borderRadius ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          borderRadius: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Expanded Widget Props */}
              {widget.type === 'Expanded' && (
                <div className={styles.section}>
                  <PropertyField label="Flex">
                    <TextInput
                      type="number"
                      value={widget.props.flex || 1}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          flex: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </PropertyField>
                </div>
              )}

              {/* Center Widget Props */}
              {widget.type === 'Center' && (
                <div className={styles.section}>
                  <p className={styles.mutedText}>Centers its child widget within itself.</p>
                </div>
              )}

              {/* Scaffold Widget Props */}
              {widget.type === 'Scaffold' && (
                <div className={styles.section}>
                  <PropertyField label="Background Color">
                    <TextInput
                      type="color"
                      value={widget.props.backgroundColor || '#ffffff'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <p className={styles.mutedText}>
                    The basic screen structure. Add an AppBar as first child and body content after.
                  </p>
                </div>
              )}

              {/* ListView Widget Props */}
              {widget.type === 'ListView' && (
                <div className={styles.section}>
                  <PropertyField label="Item Count">
                    <TextInput
                      type="number"
                      value={widget.props.itemCount ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          itemCount: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Shrink Wrap">
                    <div className={styles.inlineControl}>
                      <PropertySwitch
                        checked={widget.props.shrinkWrap || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { shrinkWrap: checked })
                        }
                      />
                      <span className={styles.mutedText}>
                        {widget.props.shrinkWrap ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Padding">
                    <TextInput
                      type="number"
                      value={widget.props.padding ?? ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          padding: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <p className={styles.mutedText}>
                    Use itemTemplate field in JSON for the repeated item structure.
                  </p>
                </div>
              )}

              {/* ListTile Widget Props */}
              {widget.type === 'ListTile' && (
                <div className={styles.section}>
                  <PropertyField label="Title">
                    <TextInput
                      value={widget.props.title || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { title: e.target.value })}
                      placeholder="List item title..."
                    />
                  </PropertyField>
                  <PropertyField label="Leading Icon">
                    <TextInput
                      value={widget.props.icon || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { icon: e.target.value })}
                      placeholder="e.g., home, settings, person"
                    />
                  </PropertyField>
                  <PropertyField label="Navigate To">
                    <PropertySelect
                      value={widget.props.actions?.route || ''}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          actions: { type: 'navigate', route: v },
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue placeholder="Select route" />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        {screenOptions.map((screen) => (
                          <PropertySelectItem key={screen.id} value={screen.route}>
                            {screen.name} ({screen.route})
                          </PropertySelectItem>
                        ))}
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                </div>
              )}

              {/* BottomNavigationBar Widget Props */}
              {widget.type === 'BottomNavigationBar' && (
                <div className={styles.section}>
                  <PropertyField label="Current Index">
                    <TextInput
                      type="number"
                      value={widget.props.currentIndex || 0}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          currentIndex: parseInt(e.target.value) || 0,
                        })
                      }
                      min={0}
                    />
                  </PropertyField>
                  <PropertyField label="Type">
                    <PropertySelect
                      value={widget.props.type || 'fixed'}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          type: v as 'fixed' | 'shifting',
                        })
                      }
                    >
                      <PropertySelectTrigger>
                        <PropertySelectValue />
                      </PropertySelectTrigger>
                      <PropertySelectContent>
                        <PropertySelectItem value="fixed">Fixed</PropertySelectItem>
                        <PropertySelectItem value="shifting">Shifting</PropertySelectItem>
                      </PropertySelectContent>
                    </PropertySelect>
                  </PropertyField>
                  <PropertyField label="Selected Item Color">
                    <TextInput
                      type="color"
                      value={widget.props.selectedItemColor || '#6200EE'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          selectedItemColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <PropertyField label="Unselected Item Color">
                    <TextInput
                      type="color"
                      value={widget.props.unselectedItemColor || '#757575'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          unselectedItemColor: e.target.value,
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>

                  <Divider />

                  <div className={styles.stackCompact}>
                    <div className={styles.row}>
                      <Text component="span" className={styles.mutedText}>
                        Navigation Items
                      </Text>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={addNavItem}
                        className={styles.addButton}
                      >
                        <Plus className={styles.addIcon} /> Add
                      </Button>
                    </div>

                    {(widget.props.items || []).map((item, index) => (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.row}>
                          <span className={styles.itemLabel}>Tab {index + 1}</span>
                          <ActionIcon
                            aria-label={`Remove navigation item ${index + 1}`}
                            size="sm"
                            variant="subtle"
                            onClick={() => removeNavItem(index)}
                            className={styles.removeButton}
                          >
                            <X className={styles.removeIcon} />
                          </ActionIcon>
                        </div>
                        <TextInput
                          value={item.label || ''}
                          onChange={(e) => updateNavItem(index, { label: e.target.value })}
                          placeholder="Label..."
                          className={styles.compactField}
                        />
                        <TextInput
                          value={item.icon || ''}
                          onChange={(e) => updateNavItem(index, { icon: e.target.value })}
                          placeholder="Icon (e.g., home, search)..."
                          className={styles.compactField}
                        />
                        <PropertySelect
                          value={item.route || ''}
                          onValueChange={(v) => updateNavItem(index, { route: v })}
                        >
                          <PropertySelectTrigger className={styles.compactField}>
                            <PropertySelectValue placeholder="Select route..." />
                          </PropertySelectTrigger>
                          <PropertySelectContent>
                            {screenOptions.map((screen) => (
                              <PropertySelectItem key={screen.id} value={screen.route}>
                                {screen.name} ({screen.route})
                              </PropertySelectItem>
                            ))}
                          </PropertySelectContent>
                        </PropertySelect>
                      </div>
                    ))}

                    {(!widget.props.items || widget.props.items.length === 0) && (
                      <p className={styles.emptyCollection}>No navigation items added yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Drawer Widget Props */}
              {widget.type === 'Drawer' && (
                <div className={styles.section}>
                  <PropertyField label="Header Title">
                    <TextInput
                      value={widget.props.header?.title || ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...drawerHeader,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Menu"
                    />
                  </PropertyField>
                  <PropertyField label="Header Subtitle">
                    <TextInput
                      value={widget.props.header?.subtitle || ''}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...drawerHeader,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Welcome"
                    />
                  </PropertyField>
                  <PropertyField label="Header Background">
                    <TextInput
                      type="color"
                      value={widget.props.header?.backgroundColor || '#6200EE'}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...drawerHeader,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className={styles.colorInput}
                    />
                  </PropertyField>
                  <p className={styles.mutedText}>
                    Add ListTile widgets as children for menu items.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.emptyState}
          >
            <p className={styles.emptyStateText}>
              Select a widget on the canvas to edit its properties
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PropertyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className={styles.stackCompact}>
    <Text component="span" className={styles.mutedText}>
      {label}
    </Text>
    {children}
  </div>
);
