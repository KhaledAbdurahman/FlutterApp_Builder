import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Save,
  Trash2,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBuilderStore } from "@/store/builderStore";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  downloadProject,
  downloadBlob,
  SavedProject,
  ProjectJsonData,
} from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ProjectManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectManager = ({ open, onOpenChange }: ProjectManagerProps) => {
  const {
    project,
    exportProject,
    loadProject,
    serverProjectId,
    setServerProjectId,
    projectTitle,
    setProjectTitle,
    projectDescription,
    setProjectDescription,
  } = useBuilderStore();

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load projects";
      setError(message);
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let isActive = true;

    const fetchAndPrefill = async () => {
      setProjectTitle(projectTitle || project.app_name);
      if (!serverProjectId) {
        setProjectDescription(projectDescription || "");
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await listProjects();
        if (!isActive) return;
        setProjects(data);
        if (serverProjectId) {
          const current = data.find((p) => p.id === serverProjectId);
          setProjectTitle(current?.name || project.app_name);
          setProjectDescription(current?.description || "");
        }
      } catch (err) {
        if (!isActive) return;
        const message =
          err instanceof Error ? err.message : "Failed to load projects";
        setError(message);
        console.error("Failed to fetch projects:", err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchAndPrefill();
    return () => {
      isActive = false;
    };
  }, [
    open,
    project.app_name,
    serverProjectId,
    setProjectTitle,
    setProjectDescription,
  ]);

  const handleSave = async () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsSaving(true);
    try {
      const exportData = exportProject();
      // Ensure json_data contains all required fields for generation
      const jsonData: ProjectJsonData = {
        app_name: exportData.app_name,
        package_name: exportData.package_name,
        screens: exportData.screens,
      };

      let savedProject: SavedProject;

      if (serverProjectId) {
        // Update existing project
        savedProject = await updateProject(serverProjectId, {
          name: projectTitle,
          description: projectDescription,
          json_data: jsonData,
        });
        toast.success("Project updated!");
      } else {
        // Create new project
        savedProject = await createProject({
          name: projectTitle,
          description: projectDescription,
          json_data: jsonData,
        });
        setServerProjectId(savedProject.id);
        toast.success("Project saved!");
      }

      fetchProjects();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save project";
      toast.error(message);
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (savedProject: SavedProject) => {
    try {
      loadProject(savedProject);
      setServerProjectId(savedProject.id);
      setProjectTitle(savedProject.name);
      setProjectDescription(savedProject.description || "");
      onOpenChange(false);
      toast.success(`Loaded "${savedProject.name}"`);
    } catch (err) {
      toast.error("Failed to load project");
      console.error("Load error:", err);
    }
  };

  const handleDelete = async (projectId: number) => {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (serverProjectId === projectId) {
        setServerProjectId(null);
      }
      toast.success("Project deleted");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
      console.error("Delete error:", err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDownload = async (projectId: number, projectName: string) => {
    try {
      const blob = await downloadProject(projectId);
      downloadBlob(blob, `${projectName}.zip`);
      toast.success("Download started!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to download project";
      toast.error(message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Manager</DialogTitle>
            <DialogDescription>
              Save your project to the server or load an existing one.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="save" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="save" className="gap-2">
                <Save className="w-4 h-4" />
                Save Project
              </TabsTrigger>
              <TabsTrigger value="load" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                Load Project
              </TabsTrigger>
            </TabsList>

            <TabsContent value="save" className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="My Flutter App"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="A brief description of your project..."
                  rows={3}
                />
              </div>
              {serverProjectId && (
                <p className="text-sm text-muted-foreground">
                  This will update the existing project (ID: {serverProjectId})
                </p>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {serverProjectId ? "Update Project" : "Save Project"}
              </Button>
            </TabsContent>

            <TabsContent value="load" className="py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {projects.length} project(s) found
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchProjects}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <ScrollArea className="h-[300px] pr-4">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No saved projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((proj) => (
                        <motion.div
                          key={proj.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:border-primary group ${
                            serverProjectId === proj.id
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                          onClick={() => handleLoad(proj)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {proj.name}
                              </h4>
                              {proj.description && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {proj.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(
                                    new Date(proj.updated_at),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(proj.id, proj.name);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(proj.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project will be permanently
              deleted from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
