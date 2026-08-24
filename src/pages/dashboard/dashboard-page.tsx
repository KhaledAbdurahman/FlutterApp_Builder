import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Button,
  Container,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Calendar, FolderOpen, LayoutGrid, Plus, Smartphone, Trash2 } from 'lucide-react';
import { PROJECT_SERVICE } from '@/api/projects';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { ChooseNotification } from '@/lib/choose-notification';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import type { IProject } from '@/types/api/project-types';
import styles from '@/pages/dashboard/dashboard-page.module.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<IProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { loadProject, setServerProjectId } = useBuilderStore();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setProjects(await PROJECT_SERVICE.getAll());
    } catch {
      ChooseNotification.failure({ message: 'Failed to load projects' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateNew = () => {
    setServerProjectId(null);
    navigate({ to: '/builder' });
  };
  const handleOpenProject = (project: IProject) => {
    loadProject(project);
    navigate({ to: '/builder' });
  };
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      await PROJECT_SERVICE.delete(deleteConfirm.id);
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== deleteConfirm.id),
      );
      ChooseNotification.success({ message: 'Project deleted successfully' });
    } catch {
      ChooseNotification.failure({ message: 'Failed to delete project' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Container size="lg" className={styles.headerContent}>
          <Link to="/" aria-label="AppBuilder home">
            <BrandLogo />
          </Link>
          <Group gap="xs">
            <ThemeToggle />
            <UserProfileMenu />
          </Group>
        </Container>
      </header>
      <main>
        <Container size="lg" className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <Title order={1}>My projects</Title>
              <Text>Manage the Flutter applications in your workspace.</Text>
            </div>
            <Button leftSection={<Plus size={18} />} onClick={handleCreateNew}>
              New project
            </Button>
          </div>
          {isLoading ? (
            <div className={styles.loading}>
              <Loader />
            </div>
          ) : projects.length === 0 ? (
            <section className={styles.emptyState}>
              <LayoutGrid size={30} />
              <Title order={2}>No projects yet</Title>
              <Text>Create a project to begin designing your Flutter app.</Text>
              <Button leftSection={<Plus size={18} />} onClick={handleCreateNew}>
                Create your first project
              </Button>
            </section>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {projects.map((project) => (
                <article key={project.id} className={styles.projectCard}>
                  <div className={styles.projectTitle}>
                    <div className={styles.projectIcon}>
                      <Smartphone size={18} />
                    </div>
                    <Title order={2}>{project.name}</Title>
                  </div>
                  {project.description && (
                    <Text className={styles.description}>{project.description}</Text>
                  )}
                  <Group gap="md" className={styles.metadata}>
                    <span>
                      <Calendar size={14} />
                      {formatDate(project.updated_at)}
                    </span>
                    <span>
                      <LayoutGrid size={14} />
                      {project.json_data.screens.length} screens
                    </span>
                  </Group>
                  <Group grow className={styles.cardActions}>
                    <Button
                      leftSection={<FolderOpen size={16} />}
                      onClick={() => handleOpenProject(project)}
                    >
                      Open
                    </Button>
                    <Button
                      variant="default"
                      color="red"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => setDeleteConfirm(project)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Group>
                </article>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </main>
      <Modal
        opened={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Delete project"
        centered
      >
        <Stack gap="lg">
          <Text>Delete “{deleteConfirm?.name}”? This action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDeleteProject}>
              Delete project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export { DashboardPage };
