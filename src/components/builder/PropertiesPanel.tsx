import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useBuilderStore } from "@/store/builderStore";
import { getWidgetDefinition, BottomNavItem } from "@/types/screen-types";
import { toast } from "sonner";
import { ActionBase } from "@/types/screen-types";

export const PropertiesPanel = () => {
  const {
    selectedWidgetId,
    getWidgetById,
    updateWidgetProps,
    deleteWidget,
    project,
  } = useBuilderStore();
  const widget = selectedWidgetId ? getWidgetById(selectedWidgetId) : null;
  const definition = widget ? getWidgetDefinition(widget.type) : null;

  const handleDelete = () => {
    if (selectedWidgetId) {
      deleteWidget(selectedWidgetId);
      toast.success("Widget deleted");
    }
  };

  const screenRoutes = project.screens.map((s) => s.route);

  const addAction = () => {
    if (!widget || widget.type !== "Button") return;
    const currentActions = widget.props.actions || [];
    const newAction: ActionBase = {
      type: "snackbar",
      message: "Action triggered!",
    };
    updateWidgetProps(widget.id, { actions: [...currentActions, newAction] });
  };

  const updateAction = (index: number, updates: Partial<ActionBase>) => {
    if (!widget || widget.type !== "Button") return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions[index] = {
      ...(currentActions[index] as ActionBase),
      ...(updates as ActionBase),
    } as ActionBase;
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  const removeAction = (index: number) => {
    if (!widget || widget.type !== "Button") return;
    const currentActions = [...(widget.props.actions || [])];
    currentActions.splice(index, 1);
    updateWidgetProps(widget.id, { actions: currentActions });
  };

  // BottomNavigationBar item helpers
  const addNavItem = () => {
    if (!widget || widget.type !== "BottomNavigationBar") return;
    const currentItems = widget.props.items || [];
    const newItem: BottomNavItem = {
      label: "New Tab",
      icon: "home",
      route: "/",
    };
    updateWidgetProps(widget.id, { items: [...currentItems, newItem] });
  };

  const updateNavItem = (index: number, updates: Partial<BottomNavItem>) => {
    if (!widget || widget.type !== "BottomNavigationBar") return;
    const currentItems = [...(widget.props.items || [])];
    currentItems[index] = { ...currentItems[index], ...updates };
    updateWidgetProps(widget.id, { items: currentItems });
  };

  const removeNavItem = (index: number) => {
    if (!widget || widget.type !== "BottomNavigationBar") return;
    const currentItems = [...(widget.props.items || [])];
    currentItems.splice(index, 1);
    updateWidgetProps(widget.id, { items: currentItems });
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
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              {/* Text Widget Props */}
              {widget.type === "Text" && (
                <div className="space-y-4">
                  <PropertyField label="Text">
                    <Input
                      value={widget.props.text || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { text: e.target.value })
                      }
                      placeholder="Enter text..."
                    />
                  </PropertyField>
                  <PropertyField label="Font Size">
                    <Input
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
                    <Select
                      value={widget.props.fontWeight || "normal"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          fontWeight: v as "normal" | "bold",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Font Style">
                    <Select
                      value={widget.props.fontStyle || "normal"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          fontStyle: v as "normal" | "italic",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Text Decoration">
                    <Select
                      value={widget.props.decoration || "none"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, { decoration: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="underline">Underline</SelectItem>
                        <SelectItem value="overline">Overline</SelectItem>
                        <SelectItem value="lineThrough">
                          Line Through
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Letter Spacing">
                    <Input
                      type="number"
                      step="0.1"
                      value={widget.props.letterSpacing ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          letterSpacing: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <PropertyField label="Max Lines">
                    <Input
                      type="number"
                      value={widget.props.maxLines ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          maxLines: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </PropertyField>
                  <PropertyField label="Overflow">
                    <Select
                      value={widget.props.overflow || "visible"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, { overflow: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="clip">Clip</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="ellipsis">Ellipsis</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Alignment">
                    <Select
                      value={widget.props.alignment || "left"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, { alignment: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      value={widget.props.color || "#000000"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { color: e.target.value })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Button Widget Props */}
              {widget.type === "Button" && (
                <div className="space-y-4">
                  <PropertyField label="Button Text">
                    <Input
                      value={widget.props.text || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { text: e.target.value })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || "#6200EE"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Text Color">
                    <Input
                      type="color"
                      value={widget.props.color || "#FFFFFF"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { color: e.target.value })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Elevation">
                    <Input
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
                    <Input
                      type="number"
                      value={widget.props.borderRadius ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          borderRadius: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Actions
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addAction}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {(widget.props.actions || []).map((action, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg space-y-2 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <Select
                            value={action.type}
                            onValueChange={(v) =>
                              updateAction(index, {
                                type: v as ActionBase["type"],
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="snackbar">Snackbar</SelectItem>
                              <SelectItem value="dialog">Dialog</SelectItem>
                              <SelectItem value="navigate">Navigate</SelectItem>
                              <SelectItem value="goBack">Go Back</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeAction(index)}
                            className="h-7 w-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        {action.type === "snackbar" && (
                          <Input
                            value={action.message || ""}
                            onChange={(e) =>
                              updateAction(index, { message: e.target.value })
                            }
                            placeholder="Message..."
                            className="h-8 text-xs"
                          />
                        )}

                        {action.type === "dialog" && (
                          <>
                            <Input
                              value={action.title || ""}
                              onChange={(e) =>
                                updateAction(index, { title: e.target.value })
                              }
                              placeholder="Dialog Title..."
                              className="h-8 text-xs"
                            />
                            <Input
                              value={action.message || ""}
                              onChange={(e) =>
                                updateAction(index, { message: e.target.value })
                              }
                              placeholder="Dialog Message..."
                              className="h-8 text-xs"
                            />
                          </>
                        )}

                        {action.type === "navigate" && (
                          <Select
                            value={action.route || ""}
                            onValueChange={(v) =>
                              updateAction(index, { route: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select route..." />
                            </SelectTrigger>
                            <SelectContent>
                              {screenRoutes.map((route) => (
                                <SelectItem key={route} value={route}>
                                  {route}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}

                    {(!widget.props.actions ||
                      widget.props.actions.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No actions added yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AppBar Widget Props */}
              {widget.type === "AppBar" && (
                <div className="space-y-4">
                  <PropertyField label="Title">
                    <Input
                      value={widget.props.title || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { title: e.target.value })
                      }
                    />
                  </PropertyField>
                  <PropertyField label="Title Color">
                    <Input
                      type="color"
                      value={widget.props.color || "#FFFFFF"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          color: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Background Color">
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || "#6200EE"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Elevation">
                    <Input
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.centerTitle ?? true}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { centerTitle: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.centerTitle !== false
                          ? "Centered"
                          : "Left-aligned"}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Show Back Button">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.showBackButton || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, {
                            showBackButton: checked,
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.showBackButton ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Auto Imply Leading">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={
                          widget.props.automaticallyImplyLeading !== false
                        }
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, {
                            automaticallyImplyLeading: checked,
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.automaticallyImplyLeading !== false
                          ? "Auto"
                          : "Manual"}
                      </span>
                    </div>
                  </PropertyField>
                </div>
              )}

              {/* Container Widget Props */}
              {widget.type === "Container" && (
                <div className="space-y-4">
                  <PropertyField label="Width">
                    <Input
                      type="number"
                      value={widget.props.layout?.w || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          layout: {
                            ...(widget.props.layout || { w: 0, h: 0 }),
                            w: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <Input
                      type="number"
                      value={widget.props.layout?.h || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          layout: {
                            ...(widget.props.layout || { w: 0, h: 0 }),
                            h: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Padding">
                    <Input
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
                    <Input
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
                    <Input
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
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.border || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { border: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.border ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </PropertyField>
                  {widget.props.border && (
                    <>
                      <PropertyField label="Border Color">
                        <Input
                          type="color"
                          value={widget.props.borderColor || "#000000"}
                          onChange={(e) =>
                            updateWidgetProps(widget.id, {
                              borderColor: e.target.value,
                            })
                          }
                          className="h-10 p-1"
                        />
                      </PropertyField>
                      <PropertyField label="Border Width">
                        <Input
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
              {(widget.type === "Row" || widget.type === "Column") && (
                <div className="space-y-4">
                  <PropertyField label="Main Axis Alignment">
                    <Select
                      value={widget.props.mainAxisAlignment || "start"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          mainAxisAlignment: v as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="spaceBetween">
                          Space Between
                        </SelectItem>
                        <SelectItem value="spaceAround">
                          Space Around
                        </SelectItem>
                        <SelectItem value="spaceEvenly">
                          Space Evenly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Cross Axis Alignment">
                    <Select
                      value={widget.props.crossAxisAlignment || "center"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          crossAxisAlignment: v as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="baseline">Baseline</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Main Axis Size">
                    <Select
                      value={widget.props.mainAxisSize || "max"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          mainAxisSize: v as "min" | "max",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="max">
                          Max (Fill available space)
                        </SelectItem>
                        <SelectItem value="min">Min (Fit content)</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                </div>
              )}

              {/* Positioned Widget Props */}
              {widget.type === "Positioned" && (
                <div className="space-y-4">
                  <PropertyField label="Top">
                    <Input
                      type="number"
                      value={widget.props.top ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          top: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Bottom">
                    <Input
                      type="number"
                      value={widget.props.bottom ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          bottom: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Left">
                    <Input
                      type="number"
                      value={widget.props.left ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          left: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Right">
                    <Input
                      type="number"
                      value={widget.props.right ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          right: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Width">
                    <Input
                      type="number"
                      value={widget.props.width ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          width: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <Input
                      type="number"
                      value={widget.props.height ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          height: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                </div>
              )}

              {/* SizedBox Widget Props */}
              {widget.type === "SizedBox" && (
                <div className="space-y-4">
                  <PropertyField label="Width">
                    <Input
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
                    <Input
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
              {widget.type === "TextField" && (
                <div className="space-y-4">
                  <PropertyField label="Hint Text">
                    <Input
                      value={widget.props.hintText || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          hintText: e.target.value,
                        })
                      }
                      placeholder="Placeholder text..."
                    />
                  </PropertyField>
                  <PropertyField label="Label Text">
                    <Input
                      value={widget.props.labelText || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          labelText: e.target.value,
                        })
                      }
                      placeholder="Field label..."
                    />
                  </PropertyField>
                  <PropertyField label="Keyboard Type">
                    <Select
                      value={widget.props.keyboardType || "text"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, { keyboardType: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="multiline">Multiline</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Obscure Text (Password)">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.obscureText || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { obscureText: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.obscureText ? "Hidden" : "Visible"}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.border !== false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { border: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.border !== false ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Prefix Icon">
                    <Input
                      value={widget.props.prefixIcon || ""}
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
              {widget.type === "Icon" && (
                <div className="space-y-4">
                  <PropertyField label="Icon Name">
                    <Input
                      value={widget.props.icon || "star"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { icon: e.target.value })
                      }
                      placeholder="e.g., star, home, person, arrow_forward_ios"
                    />
                  </PropertyField>
                  <PropertyField label="Size">
                    <Input
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
                    <Input
                      type="color"
                      value={widget.props.color || "#000000"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { color: e.target.value })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Image Widget Props */}
              {widget.type === "Image" && (
                <div className="space-y-4">
                  <PropertyField label="Image URL">
                    <Input
                      value={widget.props.src || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { src: e.target.value })
                      }
                      placeholder="https://... or asset path"
                    />
                  </PropertyField>
                  <PropertyField label="Fit">
                    <Select
                      value={widget.props.fit || "cover"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, { fit: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  <PropertyField label="Width">
                    <Input
                      type="number"
                      value={widget.props.width ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          width: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Height">
                    <Input
                      type="number"
                      value={widget.props.height ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          height: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Padding Widget Props */}
              {widget.type === "Padding" && (
                <div className="space-y-4">
                  <PropertyField label="Padding">
                    <Input
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
              {widget.type === "Card" && (
                <div className="space-y-4">
                  <PropertyField label="Elevation">
                    <Input
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
                    <Input
                      type="color"
                      value={widget.props.color || "#ffffff"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { color: e.target.value })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Margin">
                    <Input
                      type="number"
                      value={widget.props.margin ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          margin: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <PropertyField label="Border Radius">
                    <Input
                      type="number"
                      value={widget.props.borderRadius ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          borderRadius: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                </div>
              )}

              {/* Expanded Widget Props */}
              {widget.type === "Expanded" && (
                <div className="space-y-4">
                  <PropertyField label="Flex">
                    <Input
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
              {widget.type === "Center" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Centers its child widget within itself.
                  </p>
                </div>
              )}

              {/* Scaffold Widget Props */}
              {widget.type === "Scaffold" && (
                <div className="space-y-4">
                  <PropertyField label="Background Color">
                    <Input
                      type="color"
                      value={widget.props.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          backgroundColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <p className="text-xs text-muted-foreground">
                    The basic screen structure. Add an AppBar as first child and
                    body content after.
                  </p>
                </div>
              )}

              {/* ListView Widget Props */}
              {widget.type === "ListView" && (
                <div className="space-y-4">
                  <PropertyField label="Item Count">
                    <Input
                      type="number"
                      value={widget.props.itemCount ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          itemCount: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Auto"
                    />
                  </PropertyField>
                  <PropertyField label="Shrink Wrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={widget.props.shrinkWrap || false}
                        onCheckedChange={(checked) =>
                          updateWidgetProps(widget.id, { shrinkWrap: checked })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {widget.props.shrinkWrap ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </PropertyField>
                  <PropertyField label="Padding">
                    <Input
                      type="number"
                      value={widget.props.padding ?? ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          padding: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Default"
                    />
                  </PropertyField>
                  <p className="text-xs text-muted-foreground">
                    Use itemTemplate field in JSON for the repeated item
                    structure.
                  </p>
                </div>
              )}

              {/* ListTile Widget Props */}
              {widget.type === "ListTile" && (
                <div className="space-y-4">
                  <PropertyField label="Title">
                    <Input
                      value={widget.props.title || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { title: e.target.value })
                      }
                      placeholder="List item title..."
                    />
                  </PropertyField>
                  <PropertyField label="Leading Icon">
                    <Input
                      value={widget.props.icon || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, { icon: e.target.value })
                      }
                      placeholder="e.g., home, settings, person"
                    />
                  </PropertyField>
                  <PropertyField label="Navigate To">
                    <Select
                      value={widget.props.actions?.route || ""}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          actions: { type: "navigate", route: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {screenRoutes.map((route) => (
                          <SelectItem key={route} value={route}>
                            {route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyField>
                </div>
              )}

              {/* BottomNavigationBar Widget Props */}
              {widget.type === "BottomNavigationBar" && (
                <div className="space-y-4">
                  <PropertyField label="Current Index">
                    <Input
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
                    <Select
                      value={widget.props.type || "fixed"}
                      onValueChange={(v) =>
                        updateWidgetProps(widget.id, {
                          type: v as "fixed" | "shifting",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="shifting">Shifting</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyField>
                  <PropertyField label="Selected Item Color">
                    <Input
                      type="color"
                      value={widget.props.selectedItemColor || "#6200EE"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          selectedItemColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <PropertyField label="Unselected Item Color">
                    <Input
                      type="color"
                      value={widget.props.unselectedItemColor || "#757575"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          unselectedItemColor: e.target.value,
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Navigation Items
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addNavItem}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {(widget.props.items || []).map((item, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg space-y-2 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            Tab {index + 1}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeNavItem(index)}
                            className="h-7 w-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input
                          value={item.label || ""}
                          onChange={(e) =>
                            updateNavItem(index, { label: e.target.value })
                          }
                          placeholder="Label..."
                          className="h-8 text-xs"
                        />
                        <Input
                          value={item.icon || ""}
                          onChange={(e) =>
                            updateNavItem(index, { icon: e.target.value })
                          }
                          placeholder="Icon (e.g., home, search)..."
                          className="h-8 text-xs"
                        />
                        <Select
                          value={item.route || ""}
                          onValueChange={(v) =>
                            updateNavItem(index, { route: v })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select route..." />
                          </SelectTrigger>
                          <SelectContent>
                            {screenRoutes.map((route) => (
                              <SelectItem key={route} value={route}>
                                {route}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    {(!widget.props.items ||
                      widget.props.items.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No navigation items added yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Drawer Widget Props */}
              {widget.type === "Drawer" && (
                <div className="space-y-4">
                  <PropertyField label="Header Title">
                    <Input
                      value={widget.props.header?.title || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...widget.props.header,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Menu"
                    />
                  </PropertyField>
                  <PropertyField label="Header Subtitle">
                    <Input
                      value={widget.props.header?.subtitle || ""}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...widget.props.header,
                            subtitle: e.target.value,
                          },
                        })
                      }
                      placeholder="Welcome"
                    />
                  </PropertyField>
                  <PropertyField label="Header Background">
                    <Input
                      type="color"
                      value={widget.props.header?.backgroundColor || "#6200EE"}
                      onChange={(e) =>
                        updateWidgetProps(widget.id, {
                          header: {
                            ...widget.props.header,
                            backgroundColor: e.target.value,
                          },
                        })
                      }
                      className="h-10 p-1"
                    />
                  </PropertyField>
                  <p className="text-xs text-muted-foreground">
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

const PropertyField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);
