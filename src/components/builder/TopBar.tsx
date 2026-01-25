import { useState } from "react";
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
  quickGenerate,
  generateFromSaved,
  downloadProject,
  downloadBlob,
  buildApkFromSaved,
  quickBuildApk,
  downloadApk,
} from "@/lib/api";

export const TopBar = () => {
  const {
    project,
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

  const activeScreen = project.screens.find((s) => s.id === activeScreenId);

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
      let blob: Blob;

      if (serverProjectId) {
        // Generate from saved project (this endpoint returns JSON with a download URL)
        const result = await generateFromSaved(serverProjectId);

        if (typeof result === "object" && result && "status" in result) {
          const status = (result as { status?: string; message?: string })
            .status;
          const message = (result as { status?: string; message?: string })
            .message;
          if (status && status !== "success") {
            throw new Error(message || "Failed to generate project");
          }
        }

        // Then download the generated zip
        blob = await downloadProject(serverProjectId);
      } else {
        // Quick generate without saving (returns ZIP directly)
        const projectData = exportProject();
        const apiPayload = {
          app_name: projectData.app_name,
          package_name: projectData.package_name,
          json_data: {
            screens: projectData.screens,
          },
        };
        blob = await quickGenerate(apiPayload);
      }

      downloadBlob(blob, `${project.app_name}.zip`);
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
    try {
      let blob: Blob;

      if (serverProjectId) {
        // Build APK from saved project
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
            setIsBuildingApk(false);
            return;
          }

          if (status !== "success") {
            throw new Error(message || "Failed to build APK");
          }
        }

        // Download the APK
        blob = await downloadApk(serverProjectId);
      } else {
        // Quick build APK without saving
        const projectData = exportProject();
        const apiPayload = {
          app_name: projectData.app_name,
          package_name: projectData.package_name,
          json_data: {
            screens: projectData.screens,
          },
        };
        blob = await quickBuildApk(apiPayload);
      }

      downloadBlob(blob, `${project.app_name}.apk`);
      toast.success("APK built and downloaded!");
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
