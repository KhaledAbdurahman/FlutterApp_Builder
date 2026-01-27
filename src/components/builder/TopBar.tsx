import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Download,
  Settings,
  ChevronDown,
  Smartphone,
  Plus,
  X,
  Check,
  Loader2,
  FolderOpen,
  FileText,
  Package,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/lib/api";

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
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

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
