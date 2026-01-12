import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useBuilderStore } from '@/store/builderStore';
import { getWidgetDefinition, ButtonAction } from '@/types/flutter';
import { toast } from 'sonner';

export const PropertiesPanel = () => {
  const { selectedWidgetId, getWidgetById, updateWidgetProps, deleteWidget, project } = useBuilderStore();
  const widget = selectedWidgetId ? getWidgetById(selectedWidgetId) : null;
  const definition = widget ? getWidgetDefinition(widget.type) : null;

  const handleDelete = () => {
    if (selectedWidgetId) {
      deleteWidget(selectedWidgetId);
      toast.success('Widget deleted');
    }
  };

  const screenRoutes = project.screens.map(s => s.route);

  const addAction = () => {
    if (!widget) return;
    const currentActions = widget.props.actions || [];
    const newAction: ButtonAction = { type: 'snackbar', message: 'Action triggered!' };
    updateWidgetProps(widget.id, { actions: [...currentActions, newAction] });
  };

  const updateAction = (index: number, updates: Partial<ButtonAction>) => {
    if (!widget) return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions[index] = { ...currentActions[index], ...updates };
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  const removeAction = (index: number) => {
    if (!widget) return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions.splice(index, 1);
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Properties
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {widget ? (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto scrollbar-thin"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {widget.type.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{widget.type}</p>
                    <p className="text-xs text-muted-foreground">Widget</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              {/* Text Widget Props */}
              {widget.type === 'Text' && (
                <div className="space-y-4">
                  <PropertyField label="Text">
                    <Input
                      value={widget.props.text || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { text: e.target.value })}
                      placeholder="Enter text..."
                    />
                  </PropertyField>
                  <PropertyField label="Font Size">
                    <Input
                      type="number"
                      value={widget.props.fontSize || 16}
                      onChange={(e) => updateWidgetProps(widget.id, { fontSize: parseInt(e.target.value) || 16 })}
                    />
                  </PropertyField>
                  <PropertyField label="Font Weight">
                    <Select 
                      value={widget.props.fontWeight || 'normal'} 
                      onValueChange={(v) => updateWidgetProps(widget.id, { fontWeight: v as 'normal' | 'bold' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Alignment">
                    <Select 
                      value={widget.props.alignment || 'left'} 
                      onValueChange={(v) => updateWidgetProps(widget.id, { alignment: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Color">
                    <Input
                      type="color"
                      value={widget.props.color || '#000000'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className="h-10 p-1"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Button Widget Props */}
              {widget.type === 'Button' && (
                <div className="space-y-4">
                  <PropertyField label="Button Text">
                    <Input
                      value={widget.props.text || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { text: e.target.value })}
                    />
                  </PropertyField>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Actions</Label>
                      <Button size="sm" variant="outline" onClick={addAction} className="h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    
                    {(widget.props.actions || []).map((action, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Select 
                            value={action.type} 
                            onValueChange={(v) => updateAction(index, { type: v as ButtonAction['type'] })}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="snackbar">Snackbar</SelectItem>
                              <SelectItem value="dialog">Dialog</SelectItem>
                              <SelectItem value="navigate">Navigate</SelectItem>
                              <SelectItem value="goBack">Go Back</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" onClick={() => removeAction(index)} className="h-7 w-7">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {action.type === 'snackbar' && (
                          <Input
                            value={action.message || ''}
                            onChange={(e) => updateAction(index, { message: e.target.value })}
                            placeholder="Message..."
                            className="h-8 text-xs"
                          />
                        )}
                        
                        {action.type === 'dialog' && (
                          <>
                            <Input
                              value={action.title || ''}
                              onChange={(e) => updateAction(index, { title: e.target.value })}
                              placeholder="Dialog Title..."
                              className="h-8 text-xs"
                            />
                            <Input
                              value={action.message || ''}
                              onChange={(e) => updateAction(index, { message: e.target.value })}
                              placeholder="Dialog Message..."
                              className="h-8 text-xs"
                            />
                          </>
                        )}
                        
                        {action.type === 'navigate' && (
                          <Select 
                            value={action.route || ''} 
                            onValueChange={(v) => updateAction(index, { route: v })}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select route..." /></SelectTrigger>
                            <SelectContent>
                              {screenRoutes.map(route => (
                                <SelectItem key={route} value={route}>{route}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                    
                    {(!widget.props.actions || widget.props.actions.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No actions added yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AppBar Widget Props */}
              {widget.type === 'AppBar' && (
                <div className="space-y-4">
                  <PropertyField label="Title">
                    <Input
                      value={widget.props.title || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { title: e.target.value })}
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || '#6200EE'}
                      onChange={(e) => updateWidgetProps(widget.id, { backgroundColor: e.target.value })}
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Elevation">
                    <Input
                      type="number"
                      value={widget.props.elevation || 4}
                      onChange={(e) => updateWidgetProps(widget.id, { elevation: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Container Widget Props */}
              {widget.type === 'Container' && (
                <div className="space-y-4">
                  <PropertyField label="Width">
                    <Input
                      type="number"
                      value={widget.props.width || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { width: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <Input
                      type="number"
                      value={widget.props.height || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { height: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Padding">
                    <Input
                      type="number"
                      value={widget.props.padding || 0}
                      onChange={(e) => updateWidgetProps(widget.id, { padding: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                  <PropertyField label="Margin">
                    <Input
                      type="number"
                      value={widget.props.margin || 0}
                      onChange={(e) => updateWidgetProps(widget.id, { margin: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                  <PropertyField label="Border Radius">
                    <Input
                      type="number"
                      value={widget.props.borderRadius || 0}
                      onChange={(e) => updateWidgetProps(widget.id, { borderRadius: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || '#ffffff'}
                      onChange={(e) => updateWidgetProps(widget.id, { backgroundColor: e.target.value })}
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.border || false}
                        onCheckedChange={(checked) => updateWidgetProps(widget.id, { border: checked })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.border ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </PropertyField>
                </div>
              )}

              {/* Row/Column Widget Props */}
              {(widget.type === 'Row' || widget.type === 'Column') && (
                <div className="space-y-4">
                  <PropertyField label="Main Axis Alignment">
                    <Select 
                      value={widget.props.mainAxisAlignment || 'start'} 
                      onValueChange={(v) => updateWidgetProps(widget.id, { mainAxisAlignment: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="spaceBetween">Space Between</SelectItem>
                        <SelectItem value="spaceAround">Space Around</SelectItem>
                        <SelectItem value="spaceEvenly">Space Evenly</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Cross Axis Alignment">
                    <Select 
                      value={widget.props.crossAxisAlignment || 'center'} 
                      onValueChange={(v) => updateWidgetProps(widget.id, { crossAxisAlignment: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="baseline">Baseline</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                </div>
              )}

              {/* Stack Widget Props */}
              {widget.type === 'Stack' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Stack arranges children on top of each other. Use Positioned widgets inside for absolute positioning.
                  </p>
                </div>
              )}

              {/* Positioned Widget Props */}
              {widget.type === 'Positioned' && (
                <div className="space-y-4">
                  <PropertyField label="Top">
                    <Input
                      type="number"
                      value={widget.props.top ?? ''}
                      onChange={(e) => updateWidgetProps(widget.id, { top: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Bottom">
                    <Input
                      type="number"
                      value={widget.props.bottom ?? ''}
                      onChange={(e) => updateWidgetProps(widget.id, { bottom: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Left">
                    <Input
                      type="number"
                      value={widget.props.left ?? ''}
                      onChange={(e) => updateWidgetProps(widget.id, { left: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Right">
                    <Input
                      type="number"
                      value={widget.props.right ?? ''}
                      onChange={(e) => updateWidgetProps(widget.id, { right: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                    />
                  </PropertyField>
                </div>
              )}

              {/* SizedBox Widget Props */}
              {widget.type === 'SizedBox' && (
                <div className="space-y-4">
                  <PropertyField label="Width">
                    <Input
                      type="number"
                      value={widget.props.width || 0}
                      onChange={(e) => updateWidgetProps(widget.id, { width: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <Input
                      type="number"
                      value={widget.props.height || 0}
                      onChange={(e) => updateWidgetProps(widget.id, { height: parseInt(e.target.value) || 0 })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* TextField Widget Props */}
              {widget.type === 'TextField' && (
                <div className="space-y-4">
                  <PropertyField label="Hint Text">
                    <Input
                      value={widget.props.hintText || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { hintText: e.target.value })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Icon Widget Props */}
              {widget.type === 'Icon' && (
                <div className="space-y-4">
                  <PropertyField label="Icon Name">
                    <Input
                      value={widget.props.icon || 'star'}
                      onChange={(e) => updateWidgetProps(widget.id, { icon: e.target.value })}
                      placeholder="e.g., star, home, person, arrow_forward_ios"
                    />
                  </PropertyField>
                  <PropertyField label="Size">
                    <Input
                      type="number"
                      value={widget.props.size || 24}
                      onChange={(e) => updateWidgetProps(widget.id, { size: parseInt(e.target.value) || 24 })}
                    />
                  </PropertyField>
                  <PropertyField label="Color">
                    <Input
                      type="color"
                      value={widget.props.color || '#000000'}
                      onChange={(e) => updateWidgetProps(widget.id, { color: e.target.value })}
                      className="h-10 p-1"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Image Widget Props */}
              {widget.type === 'Image' && (
                <div className="space-y-4">
                  <PropertyField label="Image URL">
                    <Input
                      value={widget.props.src || ''}
                      onChange={(e) => updateWidgetProps(widget.id, { src: e.target.value })}
                      placeholder="https://... or asset path"
                    />
                  </PropertyField>
                  <PropertyField label="Fit">
                    <Select 
                      value={widget.props.fit || 'cover'} 
                      onValueChange={(v) => updateWidgetProps(widget.id, { fit: v as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="fitWidth">Fit Width</SelectItem>
                        <SelectItem value="fitHeight">Fit Height</SelectItem>
                        <SelectItem value="scaleDown">Scale Down</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                </div>
              )}

              {/* Padding Widget Props */}
              {widget.type === 'Padding' && (
                <div className="space-y-4">
                  <PropertyField label="Padding">
                    <Input
                      type="number"
                      value={widget.props.padding || 8}
                      onChange={(e) => updateWidgetProps(widget.id, { padding: parseInt(e.target.value) || 8 })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Card Widget Props */}
              {widget.type === 'Card' && (
                <div className="space-y-4">
                  <PropertyField label="Elevation">
                    <Input
                      type="number"
                      value={widget.props.elevation || 1}
                      onChange={(e) => updateWidgetProps(widget.id, { elevation: parseInt(e.target.value) || 1 })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Expanded Widget Props */}
              {widget.type === 'Expanded' && (
                <div className="space-y-4">
                  <PropertyField label="Flex">
                    <Input
                      type="number"
                      value={widget.props.flex || 1}
                      onChange={(e) => updateWidgetProps(widget.id, { flex: parseInt(e.target.value) || 1 })}
                    />
                  </PropertyField>
                </div>
              )}

              {/* Center Widget Props */}
              {widget.type === 'Center' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Centers its child widget within itself.
                  </p>
                </div>
              )}

              {/* Scaffold Widget Props */}
              {widget.type === 'Scaffold' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    The basic screen structure. Add an AppBar as first child and body content after.
                  </p>
                </div>
              )}

              {/* ListView Widget Props */}
              {widget.type === 'ListView' && (
                <div className="space-y-4">
                  <PropertyField label="Item Count">
                    <Input
                      type="number"
                      value={widget.props.itemCount || 10}
                      onChange={(e) => updateWidgetProps(widget.id, { itemCount: parseInt(e.target.value) || 10 })}
                    />
                  </PropertyField>
                  <p className="text-xs text-muted-foreground">
                    Use itemTemplate field in JSON for the repeated item structure.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center p-8"
          >
            <p className="text-muted-foreground text-sm text-center">
              Select a widget on the canvas to edit its properties
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PropertyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);
