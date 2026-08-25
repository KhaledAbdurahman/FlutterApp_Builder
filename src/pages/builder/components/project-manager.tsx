import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { formatDistanceToNow } from 'date-fns';
import { PROJECT_SERVICE } from '@/api/projects';
import { ChooseNotification } from '@/lib/choose-notification';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import type { IProject, IProjectId, IProjectJsonData } from '@/types/api/project-types';
import { downloadBlob } from '@/utils/download-blob';
import styles from '@/pages/builder/components/project-manager.module.css';

interface IProjectManagerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

type IProjectTab = 'save' | 'load';

export const ProjectManager = ({ onOpenChange, open }: IProjectManagerProps) => {
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

  const [projects, setProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<IProjectId | null>(null);
  const [activeTab, setActiveTab] = useState<IProjectTab>('save');
  const projectMetadataRef = useRef({ title: projectTitle, description: projectDescription });

  useEffect(() => {
    projectMetadataRef.current = { title: projectTitle, description: projectDescription };
  }, [projectDescription, projectTitle]);

  const fetchProjects = useCallback(async (): Promise<IProject[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await PROJECT_SERVICE.getAll();
      setProjects(data);
      return data;
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Failed to load projects';
      setError(message);
      console.error('Failed to fetch projects:', requestError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const { title, description } = projectMetadataRef.current;
    setProjectTitle(title || project.app_name);
    if (!serverProjectId) setProjectDescription(description || '');

    let isActive = true;
    void fetchProjects().then((savedProjects) => {
      if (!isActive || !serverProjectId) return;
      const currentProject = savedProjects.find(
        (savedProject) => savedProject.id === serverProjectId,
      );
      setProjectTitle(currentProject?.name || project.app_name);
      setProjectDescription(currentProject?.description || '');
    });

    return () => {
      isActive = false;
    };
  }, [
    fetchProjects,
    open,
    project.app_name,
    serverProjectId,
    setProjectDescription,
    setProjectTitle,
  ]);

  const handleSave = async () => {
    if (!projectTitle.trim()) {
      ChooseNotification.failure({ message: 'Please enter a project name' });
      return;
    }

    setIsSaving(true);

    try {
      const exportData = exportProject();
      const jsonData: IProjectJsonData = {
        app_name: exportData.app_name,
        package_name: exportData.package_name,
        screens: exportData.screens,
      };

      let savedProject: IProject;

      if (serverProjectId) {
        savedProject = await PROJECT_SERVICE.update(serverProjectId, {
          name: projectTitle,
          description: projectDescription,
          json_data: jsonData,
        });
        ChooseNotification.success({ message: 'Project updated' });
      } else {
        savedProject = await PROJECT_SERVICE.create({
          name: projectTitle,
          description: projectDescription,
          json_data: jsonData,
        });
        setServerProjectId(savedProject.id);
        ChooseNotification.success({ message: 'Project saved' });
      }

      void fetchProjects();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Failed to save project';
      ChooseNotification.failure({ message });
      console.error('Save project error:', requestError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (savedProject: IProject) => {
    try {
      loadProject(savedProject);
      setServerProjectId(savedProject.id);
      setProjectTitle(savedProject.name);
      setProjectDescription(savedProject.description || '');
      onOpenChange(false);
      ChooseNotification.success({ message: `Loaded "${savedProject.name}"` });
    } catch (requestError) {
      ChooseNotification.failure({ message: 'Failed to load project' });
      console.error('Load project error:', requestError);
    }
  };

  const handleDelete = async (projectId: IProjectId) => {
    try {
      await PROJECT_SERVICE.delete(projectId);
      setProjects((currentProjects) =>
        currentProjects.filter((savedProject) => savedProject.id !== projectId),
      );
      if (serverProjectId === projectId) setServerProjectId(null);
      ChooseNotification.success({ message: 'Project deleted' });
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Failed to delete project';
      ChooseNotification.failure({ message });
      console.error('Delete project error:', requestError);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDownload = async (projectId: IProjectId, projectName: string) => {
    try {
      const blob = await PROJECT_SERVICE.downloadFlutterApplication(projectId);
      downloadBlob(blob, `${projectName}.zip`);
      ChooseNotification.success({ message: 'Download started' });
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Failed to download project';
      ChooseNotification.failure({ message });
      console.error('Download project error:', requestError);
    }
  };

  return (
    <>
      <Modal
        centered
        classNames={{
          body: styles.modalBody,
          content: styles.modalContent,
          header: styles.modalHeader,
          title: styles.modalTitle,
        }}
        opened={open}
        size="xl"
        title="Projects"
        onClose={() => onOpenChange(false)}
      >
        <div className={styles.dialogLayout}>
          <Text className={styles.modalDescription} size="sm">
            Save the current editor state or load a project from your workspace.
          </Text>

          <div aria-label="Project actions" className={styles.tabRail} role="tablist">
            <motion.button
              aria-controls="project-save-panel"
              aria-selected={activeTab === 'save'}
              className={styles.tabButton}
              role="tab"
              type="button"
              onClick={() => setActiveTab('save')}
            >
              {activeTab === 'save' && (
                <motion.span
                  className={styles.activeTabIndicator}
                  layoutId="project-manager-active-tab"
                  transition={{ type: 'spring', duration: 0.42, bounce: 0.12 }}
                />
              )}
              <Save size={16} />
              <span>Save project</span>
            </motion.button>
            <motion.button
              aria-controls="project-load-panel"
              aria-selected={activeTab === 'load'}
              className={styles.tabButton}
              role="tab"
              type="button"
              onClick={() => setActiveTab('load')}
            >
              {activeTab === 'load' && (
                <motion.span
                  className={styles.activeTabIndicator}
                  layoutId="project-manager-active-tab"
                  transition={{ type: 'spring', duration: 0.42, bounce: 0.12 }}
                />
              )}
              <FolderOpen size={16} />
              <span>Saved projects</span>
            </motion.button>
          </div>

          <div className={styles.tabViewport}>
            <AnimatePresence initial={false} mode="wait">
              {activeTab === 'save' ? (
                <motion.section
                  key="save"
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.tabPane}
                  exit={{ opacity: 0, y: -8 }}
                  id="project-save-panel"
                  initial={{ opacity: 0, y: 8 }}
                  role="tabpanel"
                  transition={{ duration: 0.18 }}
                >
                  <div className={styles.saveHeading}>
                    <div className={styles.saveHeadingIcon}>
                      <Save size={18} />
                    </div>
                    <div>
                      <Text className={styles.saveHeadingTitle}>Current editor snapshot</Text>
                      <Text c="dimmed" size="xs">
                        Save the selected screen tree, widget settings, and app metadata together.
                      </Text>
                    </div>
                  </div>
                  <Stack className={styles.saveFields} gap="md">
                    <TextInput
                      label="Project name"
                      placeholder="My Flutter App"
                      value={projectTitle}
                      onChange={(event) => setProjectTitle(event.currentTarget.value)}
                    />
                    <Textarea
                      autosize
                      label="Description"
                      minRows={3}
                      placeholder="A brief description of your project..."
                      value={projectDescription}
                      onChange={(event) => setProjectDescription(event.currentTarget.value)}
                    />
                  </Stack>
                  <Group className={styles.saveFooter} justify="space-between">
                    <Text c="dimmed" size="xs">
                      {serverProjectId
                        ? `Updating project ${serverProjectId}`
                        : 'Creates a new server project'}
                    </Text>
                    <Button
                      leftSection={
                        isSaving ? <Loader2 className={styles.spinningIcon} /> : <Save size={16} />
                      }
                      loading={isSaving}
                      onClick={handleSave}
                    >
                      {serverProjectId ? 'Update project' : 'Save project'}
                    </Button>
                  </Group>
                </motion.section>
              ) : (
                <motion.section
                  key="load"
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.tabPane}
                  exit={{ opacity: 0, y: -8 }}
                  id="project-load-panel"
                  initial={{ opacity: 0, y: 8 }}
                  role="tabpanel"
                  transition={{ duration: 0.18 }}
                >
                  <Group className={styles.listHeader} justify="space-between">
                    <div>
                      <Text className={styles.listHeading}>Saved projects</Text>
                      <Text c="dimmed" size="xs">
                        {projects.length} project(s) available in your workspace
                      </Text>
                    </div>
                    <Button
                      leftSection={
                        <RefreshCw
                          className={isLoading ? styles.spinningIcon : undefined}
                          size={15}
                        />
                      }
                      loading={isLoading}
                      size="xs"
                      variant="light"
                      onClick={() => void fetchProjects()}
                    >
                      Refresh
                    </Button>
                  </Group>

                  {error && (
                    <Alert
                      className={styles.errorAlert}
                      color="red"
                      icon={<AlertCircle size={16} />}
                    >
                      {error}
                    </Alert>
                  )}

                  <ScrollArea className={styles.projectScrollArea} type="auto">
                    <AnimatePresence mode="popLayout">
                      {isLoading ? (
                        <LoadingState label="Loading projects" />
                      ) : projects.length === 0 ? (
                        <EmptyState />
                      ) : (
                        <Stack gap="sm">
                          {projects.map((savedProject) => (
                            <motion.div
                              key={savedProject.id}
                              animate={{ opacity: 1, y: 0 }}
                              className={
                                serverProjectId === savedProject.id
                                  ? `${styles.projectCard} ${styles.projectCardActive}`
                                  : styles.projectCard
                              }
                              exit={{ opacity: 0, scale: 0.96 }}
                              initial={{ opacity: 0, y: 10 }}
                              role="button"
                              tabIndex={0}
                              transition={{ duration: 0.16 }}
                              whileHover={{ y: -2 }}
                              onClick={() => handleLoad(savedProject)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleLoad(savedProject);
                                }
                              }}
                            >
                              <span className={styles.projectAccent} />
                              <Group align="flex-start" justify="space-between" wrap="nowrap">
                                <div className={styles.projectDetails}>
                                  <Group className={styles.projectNameRow} gap="xs">
                                    <Text className={styles.projectName} truncate>
                                      {savedProject.name}
                                    </Text>
                                    {serverProjectId === savedProject.id && (
                                      <span className={styles.activeProjectLabel}>Current</span>
                                    )}
                                  </Group>
                                  {savedProject.description && (
                                    <Text
                                      c="dimmed"
                                      className={styles.projectDescription}
                                      lineClamp={2}
                                    >
                                      {savedProject.description}
                                    </Text>
                                  )}
                                  <Group className={styles.projectMeta} gap={4}>
                                    <Clock size={13} />
                                    <span>
                                      {formatDistanceToNow(new Date(savedProject.updated_at), {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </Group>
                                </div>
                                <Group className={styles.projectActions} gap={4}>
                                  <ActionIcon
                                    aria-label={`Download ${savedProject.name}`}
                                    size="sm"
                                    title="Download generated application"
                                    variant="subtle"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDownload(savedProject.id, savedProject.name);
                                    }}
                                  >
                                    <Download size={15} />
                                  </ActionIcon>
                                  <ActionIcon
                                    aria-label={`Delete ${savedProject.name}`}
                                    color="red"
                                    size="sm"
                                    title="Delete project"
                                    variant="subtle"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setDeleteConfirmId(savedProject.id);
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </ActionIcon>
                                </Group>
                              </Group>
                            </motion.div>
                          ))}
                        </Stack>
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Modal>

      <Modal
        centered
        classNames={{ content: styles.deleteModalContent, title: styles.modalTitle }}
        opened={deleteConfirmId !== null}
        size="sm"
        title="Delete project?"
        onClose={() => setDeleteConfirmId(null)}
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            This permanently deletes the project from the server and cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => deleteConfirmId && void handleDelete(deleteConfirmId)}
            >
              Delete project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

const LoadingState = ({ label }: { label: string }) => (
  <div className={styles.loadingState}>
    <Loader2 className={styles.loadingIcon} />
    <Text c="dimmed" size="sm">
      {label}
    </Text>
  </div>
);

const EmptyState = () => (
  <div className={styles.emptyState}>
    <FileText className={styles.emptyStateIcon} />
    <Text c="dimmed" size="sm">
      No saved projects yet
    </Text>
  </div>
);
