import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Download,
  Settings,
  ChevronDown,
  Plus,
  X,
  Check,
  Loader2,
  FolderOpen,
  FileText,
  Package,
  Save,
  BookOpen,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBuilderStore } from "@/store/builderStore";
import { toast } from "sonner";
import { ProjectManager } from "./ProjectManager";
import { GenerationLogs } from "./GenerationLogs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import {
  generateFromSaved,
  downloadProject,
  downloadBlob,
  buildApkFromSaved,
  downloadApk,
  updateProject,
  ProjectJsonData,
  createProject,
} from "@/lib/api";
import {
  ComponentType,
  DEFAULT_COMPONENT_PROPS,
  FlutterWidget,
  Screen,
  WIDGET_DEFINITIONS,
  getChildConfig,
  resolveWidgetProps,
} from "@/types/screen-types";
import {
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  VALIDATION_RULES,
} from "@/dnd/validationRules";
import { v4 as uuidv4 } from "uuid";

const allowedWidgetTypes = new Set(
  WIDGET_DEFINITIONS.map((definition) => definition.type),
);

const toRoute = (name: string) => `/${name.toLowerCase().replace(/\s+/g, "-")}`;

const buildSchemaDocument = (): string => {
  const widgetSchemas = WIDGET_DEFINITIONS.filter(
    (definition) => definition.type !== "ListView",
  ).map((definition) => ({
    type: definition.type,
    label: definition.label,
    category: definition.category,
    childConfig: definition.childConfig,
    defaultProps: DEFAULT_COMPONENT_PROPS[definition.type],
  }));

  return [
    "Flutter Builder Specification (AI-ready)",
    "",
    "Notes:",
    "- Each Scaffold is wrapped with SingleChildScrollView in the backend.",
    "- Screen overflow is handled automatically; no manual overflow widgets needed.",
    "- Button actions are REQUIRED when using the Button widget.",
    "",
    "Screen Schema:",
    JSON.stringify(
      {
        id: "string",
        name: "string",
        route: "/route",
        is_home: true,
        components: ["Component"],
      },
      null,
      2,
    ),
    "",
    "Component Schema:",
    JSON.stringify(
      {
        id: "string",
        type: "ComponentType",
        props: "Partial<ComponentPropsByType[ComponentType]>",
        children: "Component[] (optional)",
      },
      null,
      2,
    ),
    "",
    "Button actions schema:",
    JSON.stringify(
      {
        actions: [
          { type: "snackbar", message: "string" },
          { type: "dialog", title: "string", message: "string" },
          { type: "navigate", route: "/route" },
          { type: "goBack" },
        ],
      },
      null,
      2,
    ),
    "",
    "Component Definitions (excluding ListView):",
    JSON.stringify(widgetSchemas, null, 2),
    "",
    "Rules:",
    "- Root-only widgets: " + JSON.stringify(ROOT_ONLY_WIDGETS),
    "- Required parents: " + JSON.stringify(REQUIRED_PARENTS),
    "- Forbidden parent/child pairs: " +
      JSON.stringify(
        VALIDATION_RULES.filter((rule) => rule.result === "forbidden"),
        null,
        2,
      ),
  ].join("\n");
};

const normalizeProps = (
  type: ComponentType,
  rawProps: Record<string, unknown> | undefined,
) => {
  const defaults = DEFAULT_COMPONENT_PROPS[type] as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  if (!rawProps) return cleaned;
  Object.keys(defaults).forEach((key) => {
    if (key in rawProps) cleaned[key] = rawProps[key];
  });
  return cleaned;
};

export const TopBar = () => {
  const {
    project,
    projectTitle,
    projectDescription,
    activeScreenId,
    setActiveScreen,
    addScreen,
    deleteScreen,
    setProjectName,
    setPackageName,
    exportProject,
    serverProjectId,
    importProjectData,
    loadProject,
  } = useBuilderStore();

  const [newScreenName, setNewScreenName] = useState("");
  const [showNewScreen, setShowNewScreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(project.app_name);
  const [tempPackageName, setTempPackageName] = useState(project.package_name);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [hasGeneratedProject, setHasGeneratedProject] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("[]");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importScreens, setImportScreens] = useState<Screen[] | null>(null);
  const [importReport, setImportReport] = useState("");
  const [importAppName, setImportAppName] = useState(project.app_name);
  const [importPackageName, setImportPackageName] = useState(
    project.package_name,
  );
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const schemaDocument = useMemo(() => buildSchemaDocument(), []);

  const activeScreen = project.screens.find((s) => s.id === activeScreenId);

  useEffect(() => {
    setHasGeneratedProject(false);
  }, [serverProjectId]);

  useEffect(() => {
    if (autoSaveState !== "saved") return;
    const timeoutId = window.setTimeout(() => {
      setAutoSaveState("idle");
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [autoSaveState]);

  const performSave = useCallback(
    async (showToast = false) => {
      if (!serverProjectId || isAutoSaving) return;
      setIsAutoSaving(true);
      setAutoSaveState("saving");
      try {
        const exportData = exportProject();
        const jsonData: ProjectJsonData = {
          app_name: exportData.app_name,
          package_name: exportData.package_name,
          screens: exportData.screens,
        };
        const name = projectTitle.trim() || project.app_name;
        await updateProject(serverProjectId, {
          name,
          description: projectDescription,
          json_data: jsonData,
        });
        setAutoSaveState("saved");
        if (showToast) {
          toast.success("Project saved");
        }
      } catch (error) {
        setAutoSaveState("error");
        if (showToast) {
          toast.error(
            error instanceof Error ? error.message : "Failed to save project",
          );
        }
      } finally {
        setIsAutoSaving(false);
      }
    },
    [
      serverProjectId,
      isAutoSaving,
      exportProject,
      projectTitle,
      projectDescription,
      project.app_name,
    ],
  );

  useEffect(() => {
    if (!serverProjectId) return;
    const intervalId = window.setInterval(() => {
      performSave(false);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [serverProjectId, performSave]);

  const handleAddScreen = () => {
    if (newScreenName.trim()) {
      addScreen(newScreenName.trim());
      setNewScreenName("");
      setShowNewScreen(false);
      toast.success("Screen created!");
    }
  };

  const handleExport = () => {
    const exportData = exportProject();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.app_name}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project exported!");
  };

  const handleSaveSettings = () => {
    setProjectName(tempProjectName);
    setPackageName(tempPackageName);
    setSettingsOpen(false);
    toast.success("Settings saved!");
  };

  const validateImportedScreens = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON format";
      setImportErrors([`JSON parse error: ${message}`]);
      setImportWarnings([]);
      setImportScreens(null);
      setImportReport(`Errors (1)\n- JSON parse error: ${message}`);
      return;
    }

    if (!Array.isArray(parsed)) {
      const message = "Input must be an array of screens.";
      setImportErrors([message]);
      setImportWarnings([]);
      setImportScreens(null);
      setImportReport(`Errors (1)\n- ${message}`);
      return;
    }

    const explicitHome = parsed.some(
      (screen) =>
        !!screen &&
        typeof screen === "object" &&
        (screen as { is_home?: boolean }).is_home === true,
    );

    const normalizeWidget = (
      input: unknown,
      parentType: ComponentType | null,
      path: string,
    ): FlutterWidget | null => {
      if (!input || typeof input !== "object") {
        errors.push(`${path}: widget must be an object.`);
        return null;
      }

      const rawType = (input as { type?: ComponentType }).type;
      if (!rawType || !allowedWidgetTypes.has(rawType)) {
        errors.push(`${path}: invalid widget type "${String(rawType)}".`);
        return null;
      }

      const type = rawType;

      if (parentType && ROOT_ONLY_WIDGETS.includes(type)) {
        errors.push(`${path}: ${type} can only be at the screen root.`);
        return null;
      }

      const requiredParents = REQUIRED_PARENTS[type];
      if (
        requiredParents &&
        (!parentType || !requiredParents.includes(parentType))
      ) {
        errors.push(
          `${path}: ${type} must be inside ${requiredParents.join(" or ")}.`,
        );
        return null;
      }

      if (parentType) {
        const forbiddenRule = VALIDATION_RULES.find(
          (rule) =>
            rule.parentType === parentType &&
            rule.childType === type &&
            rule.result === "forbidden",
        );
        if (forbiddenRule) {
          errors.push(
            `${path}: ${forbiddenRule.message || `${parentType} cannot contain ${type}`}.`,
          );
          return null;
        }
      }

      const idValue = (input as { id?: unknown }).id;
      const id =
        typeof idValue === "string" && idValue.trim() ? idValue : uuidv4();
      if (id !== idValue) {
        warnings.push(`${path}: missing id, generated "${id}".`);
      }

      const rawProps = (input as { props?: unknown }).props;
      const propsObject =
        rawProps && typeof rawProps === "object" && !Array.isArray(rawProps)
          ? (rawProps as Record<string, unknown>)
          : undefined;
      if (rawProps !== undefined && !propsObject) {
        warnings.push(
          `${path}: props must be an object; default props applied.`,
        );
      }

      const cleanedProps = normalizeProps(type, propsObject);
      const resolvedProps = resolveWidgetProps(type, cleanedProps);

      const childConfig = getChildConfig(type);
      let rawChildren = (input as { children?: unknown }).children;
      let childrenArray = Array.isArray(rawChildren) ? rawChildren : [];

      if (rawChildren !== undefined && !Array.isArray(rawChildren)) {
        warnings.push(
          `${path}: children must be an array; ignored invalid value.`,
        );
      }

      if (childConfig?.mode === "none" && childrenArray.length > 0) {
        warnings.push(
          `${path}: ${type} cannot have children; children removed.`,
        );
        childrenArray = [];
      }

      if (childConfig?.mode === "single" && childrenArray.length > 1) {
        warnings.push(
          `${path}: ${type} allows one child; extra children removed.`,
        );
        childrenArray = [childrenArray[0]];
      }

      if (
        childConfig?.maxChildren &&
        childrenArray.length > childConfig.maxChildren
      ) {
        warnings.push(
          `${path}: ${type} allows ${childConfig.maxChildren} children; extras removed.`,
        );
        childrenArray = childrenArray.slice(0, childConfig.maxChildren);
      }

      const normalizedChildren = childrenArray
        .map((child, index) =>
          normalizeWidget(child, type, `${path}.children[${index}]`),
        )
        .filter(Boolean) as FlutterWidget[];

      return {
        id,
        type,
        props: resolvedProps,
        children:
          normalizedChildren.length > 0 ? normalizedChildren : undefined,
      } as FlutterWidget;
    };

    const normalizedScreens: Screen[] = parsed.map((screen, index) => {
      if (!screen || typeof screen !== "object") {
        errors.push(`screens[${index}]: screen must be an object.`);
        return {
          id: uuidv4(),
          name: `Screen ${index + 1}`,
          route: `/screen-${index + 1}`,
          is_home: !explicitHome && index === 0,
          components: [],
        } as Screen;
      }

      const rawId = (screen as { id?: unknown }).id;
      const id = typeof rawId === "string" && rawId.trim() ? rawId : uuidv4();
      if (id !== rawId)
        warnings.push(`screens[${index}]: missing id, generated.`);

      const rawName = (screen as { name?: unknown }).name;
      const name =
        typeof rawName === "string" && rawName.trim()
          ? rawName
          : `Screen ${index + 1}`;
      if (name !== rawName)
        warnings.push(`screens[${index}]: missing name, defaulted.`);

      const rawRoute = (screen as { route?: unknown }).route;
      const route =
        typeof rawRoute === "string" && rawRoute.trim()
          ? rawRoute
          : toRoute(name);
      if (route !== rawRoute)
        warnings.push(`screens[${index}]: missing route, generated.`);

      const rawIsHome = (screen as { is_home?: unknown }).is_home;
      const is_home =
        typeof rawIsHome === "boolean"
          ? rawIsHome
          : !explicitHome && index === 0;
      if (rawIsHome === undefined) {
        warnings.push(`screens[${index}]: missing is_home, defaulted.`);
      }

      const rawComponents = (screen as { components?: unknown }).components;
      const componentsArray = Array.isArray(rawComponents) ? rawComponents : [];
      if (rawComponents !== undefined && !Array.isArray(rawComponents)) {
        warnings.push(
          `screens[${index}]: components must be an array; ignored invalid value.`,
        );
      }

      const components = componentsArray
        .map((component, compIndex) =>
          normalizeWidget(
            component,
            null,
            `screens[${index}].components[${compIndex}]`,
          ),
        )
        .filter(Boolean) as FlutterWidget[];

      return {
        id,
        name,
        route,
        is_home,
        components,
      } as Screen;
    });

    if (!normalizedScreens.some((screen) => screen.is_home)) {
      normalizedScreens[0].is_home = true;
      warnings.push("No home screen found; first screen set as home.");
    }

    const report = [
      errors.length
        ? `Errors (${errors.length})\n- ${errors.join("\n- ")}`
        : "Errors: none",
      warnings.length
        ? `Warnings (${warnings.length})\n- ${warnings.join("\n- ")}`
        : "Warnings: none",
    ].join("\n\n");

    setImportErrors(errors);
    setImportWarnings(warnings);
    setImportScreens(normalizedScreens);
    setImportReport(report);
  }, [importText]);

  const applyImportedScreens = useCallback(() => {
    if (!importScreens || importErrors.length > 0) return;
    importProjectData({
      app_name: importAppName.trim() || "My App",
      package_name: importPackageName.trim() || "com.example.app",
      screens: importScreens,
    });
    toast.success("Screens imported to canvas.");
    setImportOpen(false);
  }, [
    importScreens,
    importErrors.length,
    importProjectData,
    importAppName,
    importPackageName,
  ]);

  const saveImportedProject = useCallback(async () => {
    if (!importScreens || importErrors.length > 0) return;
    try {
      const name = importAppName.trim() || "My App";
      const payload: ProjectJsonData = {
        app_name: name,
        package_name: importPackageName.trim() || "com.example.app",
        screens: importScreens,
      };
      const saved = await createProject({
        name,
        json_data: payload,
      });
      loadProject(saved);
      toast.success("Project imported and saved.");
      setImportOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save imported project",
      );
    }
  }, [
    importScreens,
    importErrors.length,
    importAppName,
    importPackageName,
    loadProject,
  ]);

  const handleGenerateApp = async () => {
    setIsGenerating(true);
    try {
      if (!serverProjectId) {
        throw new Error("Please save the project before generating.");
      }

      // Generate from saved project (no download here)
      const result = await generateFromSaved(serverProjectId);

      if (typeof result === "object" && result && "status" in result) {
        const status = (result as { status?: string; message?: string }).status;
        const message = (result as { status?: string; message?: string })
          .message;
        if (status && status !== "success") {
          throw new Error(message || "Failed to generate project");
        }
      }

      const blob = await downloadProject(serverProjectId);
      downloadBlob(blob, `${project.app_name}.zip`);

      setHasGeneratedProject(true);
      toast.success("Flutter app generated and downloaded!");
    } catch (error) {
      console.error("Generation error:", error);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error(
          "Cannot connect to backend. This could be a CORS issue or the server is not running. " +
            "Ensure Django has CORS headers enabled for this origin.",
          { duration: 6000 },
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to generate app.",
          { duration: 5000 },
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuildApk = async () => {
    setIsBuildingApk(true);
    const toastId = "build-apk";
    try {
      if (!serverProjectId) {
        throw new Error("Please save the project before building APK.");
      }

      toast.loading("Generating Flutter project...", { id: toastId });

      // Always generate before building
      const generateResult = await generateFromSaved(serverProjectId);

      if (
        typeof generateResult === "object" &&
        generateResult &&
        "status" in generateResult
      ) {
        const status = (generateResult as { status?: string; message?: string })
          .status;
        const message = (
          generateResult as { status?: string; message?: string }
        ).message;
        if (status && status !== "success") {
          throw new Error(message || "Failed to generate project");
        }
      }

      toast.loading("Building APK...", { id: toastId });

      const result = await buildApkFromSaved(serverProjectId);

      if (typeof result === "object" && result && "status" in result) {
        const status = result.status;
        const message = result.message;

        if (status === "building") {
          toast.info(
            message || "APK build started. This may take a few minutes...",
            { duration: 5000 },
          );
          // Poll or wait for completion - for now show message
          toast.dismiss(toastId);
          setIsBuildingApk(false);
          return;
        }

        if (status !== "success") {
          throw new Error(message || "Failed to build APK");
        }
      }

      const blob = await downloadApk(serverProjectId);

      downloadBlob(blob, `${project.app_name}.apk`);
      setHasGeneratedProject(true);
      toast.success("APK built and downloaded!", { id: toastId });
    } catch (error) {
      console.error("APK build error:", error);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error(
          "Cannot connect to backend. This could be a CORS issue or the server is not running.",
          { duration: 6000 },
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to build APK.",
          { duration: 5000 },
        );
      }
    } finally {
      toast.dismiss(toastId);
      setIsBuildingApk(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 border-b border-border bg-card flex items-center justify-between px-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-30 h-10 rounded-xl flex items-center justify-center">
            <img
              src="/Builder.png"
              alt="AppBuilder Logo"
              className="w-30 h-14"
            />
          </div>
          {/* <span className="font-semibold text-lg">{project.app_name}</span> */}
        </div>

        <div className="h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <span className="text-muted-foreground text-sm">Screen:</span>
              <span className="font-medium">
                {activeScreen?.name || "Select"}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {project.screens.map((screen) => (
              <DropdownMenuItem
                key={screen.id}
                onClick={() => setActiveScreen(screen.id)}
                className="flex items-center justify-between"
              >
                <span>{screen.name}</span>
                <div className="flex items-center gap-2">
                  {screen.is_home && (
                    <span className="text-xs text-primary">Home</span>
                  )}
                  {screen.id === activeScreenId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {showNewScreen ? (
              <div className="p-2 flex gap-2">
                <Input
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="Screen name"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddScreen()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddScreen} className="h-8">
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewScreen(false)}
                  className="h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <DropdownMenuItem onClick={() => setShowNewScreen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Screen
              </DropdownMenuItem>
            )}
            {project.screens.length > 1 &&
              activeScreen &&
              !activeScreen.is_home && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteScreen(activeScreenId)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete Current Screen
                  </DropdownMenuItem>
                </>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Dialog open={schemaOpen} onOpenChange={setSchemaOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Spec
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Component & Screen Specification</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={schemaDocument}
                readOnly
                className="min-h-[360px] font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(schemaDocument);
                    toast.success("Specification copied.");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import Screens
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Import External Screens</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Screens JSON</label>
                <Textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder='Paste an array of screens: [{"id":"...","name":"Home","route":"/","is_home":true,"components":[]}]'
                  className="min-h-[180px] font-mono text-xs"
                />
                <Button variant="outline" onClick={validateImportedScreens}>
                  Validate & Normalize
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Validation Report
                  </label>
                  <Textarea
                    value={importReport}
                    readOnly
                    className="min-h-[160px] font-mono text-xs"
                    placeholder="Run validation to see errors and warnings."
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!importReport) return;
                      navigator.clipboard.writeText(importReport);
                      toast.success("Report copied.");
                    }}
                  >
                    Copy Report
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Normalized Output
                  </label>
                  <Textarea
                    value={
                      importScreens
                        ? JSON.stringify(importScreens, null, 2)
                        : ""
                    }
                    readOnly
                    className="min-h-[160px] font-mono text-xs"
                    placeholder="Normalized screens will appear here."
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!importScreens) return;
                      navigator.clipboard.writeText(
                        JSON.stringify(importScreens, null, 2),
                      );
                      toast.success("Normalized screens copied.");
                    }}
                  >
                    Copy Output
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Name</label>
                  <Input
                    value={importAppName}
                    onChange={(event) => setImportAppName(event.target.value)}
                    placeholder="My App"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Package Name</label>
                  <Input
                    value={importPackageName}
                    onChange={(event) =>
                      setImportPackageName(event.target.value)
                    }
                    placeholder="com.example.myapp"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <span className="text-xs text-muted-foreground self-center">
                  {importErrors.length} errors, {importWarnings.length} warnings
                </span>
                <Button
                  variant="outline"
                  onClick={applyImportedScreens}
                  disabled={!importScreens || importErrors.length > 0}
                >
                  Apply to Canvas
                </Button>
                <Button
                  onClick={saveImportedProject}
                  disabled={!importScreens || importErrors.length > 0}
                >
                  Save Project
                </Button>
              </div>
              {importErrors.length > 0 && (
                <p className="text-xs text-destructive">
                  Fix validation errors before applying or saving.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <div className="h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setProjectManagerOpen(true)}
          className="gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Projects
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => performSave(true)}
          className="gap-2"
          disabled={!serverProjectId || isAutoSaving}
        >
          {isAutoSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isAutoSaving
            ? "Saving..."
            : autoSaveState === "saved"
              ? "Saved"
              : "Save"}
        </Button>
        {serverProjectId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogsOpen(true)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Logs
          </Button>
        )}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">App Name</label>
                <Input
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  placeholder="my_flutter_app"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Package Name</label>
                <Input
                  value={tempPackageName}
                  onChange={(e) => setTempPackageName(e.target.value)}
                  placeholder="com.example.myapp"
                />
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
        <Button
          size="sm"
          className="gap-2 gradient-primary hover:opacity-90 text-primary-foreground border-0"
          onClick={handleGenerateApp}
          disabled={isGenerating || isBuildingApk}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isGenerating ? "Generating..." : "Generate App"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={handleBuildApk}
          disabled={isGenerating || isBuildingApk}
        >
          {isBuildingApk ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Package className="w-4 h-4" />
          )}
          {isBuildingApk ? "Building..." : "Build APK"}
        </Button>
        <UserProfileMenu />
      </div>

      <ProjectManager
        open={projectManagerOpen}
        onOpenChange={setProjectManagerOpen}
      />
      <GenerationLogs open={logsOpen} onOpenChange={setLogsOpen} />
    </motion.header>
  );
};
