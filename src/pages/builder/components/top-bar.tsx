import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Download,
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
  MonitorPlay,
} from 'lucide-react';
import {
  Button,
  Divider,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import { ChooseNotification } from '@/lib/choose-notification';
import { ProjectManager } from '@/pages/builder/components/project-manager';
import { GenerationLogs } from '@/pages/builder/components/generation-logs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import BrandLogo from '@/components/BrandLogo';
import { PROJECT_SERVICE } from '@/api/projects';
import type { IProjectJsonData } from '@/types/api/project-types';
import { downloadBlob } from '@/utils/download-blob';
import {
  ComponentType,
  DEFAULT_COMPONENT_PROPS,
  FlutterWidget,
  Screen,
  WIDGET_DEFINITIONS,
  getChildConfig,
  resolveWidgetProps,
} from '@/types/screen-types';
import {
  REQUIRED_PARENTS,
  ROOT_ONLY_WIDGETS,
  VALIDATION_RULES,
} from '@/pages/builder/dnd/validation-rules';
import { v4 as uuidv4 } from 'uuid';
import styles from '@/pages/builder/components/top-bar.module.css';

const allowedWidgetTypes = new Set(WIDGET_DEFINITIONS.map((definition) => definition.type));

const toRoute = (name: string) => `/${name.toLowerCase().replace(/\s+/g, '-')}`;

interface ITopBarProps {
  isPreviewOpen: boolean;
  onLaunchPreview: () => void;
}

const buildSchemaDocument = (): string => {
  const widgetSchemas = WIDGET_DEFINITIONS.filter(
    (definition) => definition.type !== 'ListView',
  ).map((definition) => ({
    type: definition.type,
    label: definition.label,
    category: definition.category,
    childConfig: definition.childConfig,
    defaultProps: DEFAULT_COMPONENT_PROPS[definition.type],
  }));

  return [
    'Flutter Builder Specification (AI-ready)',
    '',
    'Notes:',
    '- Each Scaffold is wrapped with SingleChildScrollView in the backend.',
    '- Screen overflow is handled automatically; no manual overflow widgets needed.',
    '- Button actions are REQUIRED when using the Button widget.',
    '',
    'Screen Schema:',
    JSON.stringify(
      {
        id: 'string',
        name: 'string',
        route: '/route',
        is_home: true,
        components: ['Component'],
      },
      null,
      2,
    ),
    '',
    'Component Schema:',
    JSON.stringify(
      {
        id: 'string',
        type: 'ComponentType',
        props: 'Partial<ComponentPropsByType[ComponentType]>',
        children: 'Component[] (optional)',
        itemTemplate: 'Component (ListView only, optional)',
      },
      null,
      2,
    ),
    '',
    'ListView itemTemplate example:',
    JSON.stringify(
      {
        type: 'ListView',
        props: { itemCount: 1, shrinkWrap: false, padding: 0 },
        itemTemplate: {
          type: 'Column',
          children: ['Component'],
        },
      },
      null,
      2,
    ),
    '',
    'Button actions schema:',
    JSON.stringify(
      {
        actions: [
          { type: 'snackbar', message: 'string' },
          { type: 'dialog', title: 'string', message: 'string' },
          { type: 'navigate', route: '/route' },
          { type: 'goBack' },
        ],
      },
      null,
      2,
    ),
    '',
    'Component Definitions (excluding ListView):',
    JSON.stringify(widgetSchemas, null, 2),
    '',
    'Rules:',
    '- Root-only widgets: ' + JSON.stringify(ROOT_ONLY_WIDGETS),
    '- Required parents: ' + JSON.stringify(REQUIRED_PARENTS),
    '- Forbidden parent/child pairs: ' +
      JSON.stringify(
        VALIDATION_RULES.filter((rule) => rule.result === 'forbidden'),
        null,
        2,
      ),
  ].join('\n');
};

const normalizeProps = (type: ComponentType, rawProps: Record<string, unknown> | undefined) => {
  const defaults = DEFAULT_COMPONENT_PROPS[type] as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  if (!rawProps) return cleaned;
  Object.keys(defaults).forEach((key) => {
    if (key in rawProps) cleaned[key] = rawProps[key];
  });

  if (type === 'Button') {
    if ('textColor' in rawProps && !('color' in rawProps)) {
      cleaned.color = rawProps.textColor;
    }
  }

  if (type === 'Padding') {
    if ('padding' in rawProps && !('all' in rawProps)) {
      cleaned.all = rawProps.padding;
    }
  }

  if (type === 'Container') {
    const layoutRaw =
      rawProps.layout && typeof rawProps.layout === 'object'
        ? (rawProps.layout as Record<string, unknown>)
        : undefined;
    const width = rawProps.width;
    const height = rawProps.height;
    if (layoutRaw || width !== undefined || height !== undefined) {
      cleaned.layout = {
        ...(layoutRaw || {}),
        ...(typeof width === 'number' ? { w: width } : {}),
        ...(typeof height === 'number' ? { h: height } : {}),
      };
    }
  }

  if (type === 'Text') {
    if (rawProps.fontWeight === 'w600') {
      cleaned.fontWeight = 'bold';
    }
  }

  return cleaned;
};

export const TopBar = ({ isPreviewOpen, onLaunchPreview }: ITopBarProps) => {
  const {
    project,
    projectTitle,
    projectDescription,
    activeScreenId,
    setActiveScreen,
    addScreen,
    deleteScreen,
    exportProject,
    serverProjectId,
    importProjectData,
    loadProject,
  } = useBuilderStore();

  const [newScreenName, setNewScreenName] = useState('');
  const [screenMenuOpen, setScreenMenuOpen] = useState(false);
  const [addScreenDialogOpen, setAddScreenDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [hasGeneratedProject, setHasGeneratedProject] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('[]');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importScreens, setImportScreens] = useState<Screen[] | null>(null);
  const [importReport, setImportReport] = useState('');
  const [importAppName, setImportAppName] = useState(project.app_name);
  const [importPackageName, setImportPackageName] = useState(project.package_name);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const schemaDocument = useMemo(() => buildSchemaDocument(), []);

  const activeScreen = project.screens.find((s) => s.id === activeScreenId);

  useEffect(() => {
    setHasGeneratedProject(false);
  }, [serverProjectId]);

  useEffect(() => {
    if (autoSaveState !== 'saved') return;
    const timeoutId = window.setTimeout(() => {
      setAutoSaveState('idle');
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [autoSaveState]);

  const performSave = useCallback(
    async (showToast = false) => {
      if (!serverProjectId || isAutoSaving) return;
      setIsAutoSaving(true);
      setAutoSaveState('saving');
      try {
        const exportData = exportProject();
        const jsonData: IProjectJsonData = {
          app_name: exportData.app_name,
          package_name: exportData.package_name,
          screens: exportData.screens,
        };
        const name = projectTitle.trim() || project.app_name;
        await PROJECT_SERVICE.update(serverProjectId, {
          name,
          description: projectDescription,
          json_data: jsonData,
        });
        setAutoSaveState('saved');
        if (showToast) {
          ChooseNotification.success({ message: 'Project saved' });
        }
      } catch (error) {
        setAutoSaveState('error');
        if (showToast) {
          ChooseNotification.failure({
            message: error instanceof Error ? error.message : 'Failed to save project',
          });
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
      setNewScreenName('');
      setAddScreenDialogOpen(false);
      ChooseNotification.success({ message: 'Screen created' });
    }
  };

  const handleOpenAddScreenDialog = () => {
    setScreenMenuOpen(false);

    setAddScreenDialogOpen(true);
  };

  const handleExport = () => {
    const exportData = exportProject();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.app_name}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    ChooseNotification.success({ message: 'Project exported' });
  };

  const validateImportedScreens = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON format';
      setImportErrors([`JSON parse error: ${message}`]);
      setImportWarnings([]);
      setImportScreens(null);
      setImportReport(`Errors (1)\n- JSON parse error: ${message}`);
      return;
    }

    if (!Array.isArray(parsed)) {
      const message = 'Input must be an array of screens.';
      setImportErrors([message]);
      setImportWarnings([]);
      setImportScreens(null);
      setImportReport(`Errors (1)\n- ${message}`);
      return;
    }

    const explicitHome = parsed.some(
      (screen) =>
        !!screen &&
        typeof screen === 'object' &&
        (screen as { is_home?: boolean }).is_home === true,
    );

    const normalizeWidget = (
      input: unknown,
      parentType: ComponentType | null,
      path: string,
    ): FlutterWidget | null => {
      if (!input || typeof input !== 'object') {
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
      if (requiredParents && (!parentType || !requiredParents.includes(parentType))) {
        errors.push(`${path}: ${type} must be inside ${requiredParents.join(' or ')}.`);
        return null;
      }

      if (parentType) {
        const forbiddenRule = VALIDATION_RULES.find(
          (rule) =>
            rule.parentType === parentType &&
            rule.childType === type &&
            rule.result === 'forbidden',
        );
        if (forbiddenRule) {
          errors.push(
            `${path}: ${forbiddenRule.message || `${parentType} cannot contain ${type}`}.`,
          );
          return null;
        }
      }

      const idValue = (input as { id?: unknown }).id;
      const id = typeof idValue === 'string' && idValue.trim() ? idValue : uuidv4();
      if (id !== idValue) {
        warnings.push(`${path}: missing id, generated "${id}".`);
      }

      const rawProps = (input as { props?: unknown }).props;
      const propsObject =
        rawProps && typeof rawProps === 'object' && !Array.isArray(rawProps)
          ? (rawProps as Record<string, unknown>)
          : undefined;
      if (rawProps !== undefined && !propsObject) {
        warnings.push(`${path}: props must be an object; default props applied.`);
      }

      const cleanedProps = normalizeProps(type, propsObject);
      const resolvedProps = resolveWidgetProps(type, cleanedProps);

      const childConfig = getChildConfig(type);
      const rawChildren = (input as { children?: unknown }).children;
      let childrenArray = Array.isArray(rawChildren) ? rawChildren : [];

      if (rawChildren !== undefined && !Array.isArray(rawChildren)) {
        warnings.push(`${path}: children must be an array; ignored invalid value.`);
      }

      if (childConfig?.mode === 'none' && childrenArray.length > 0) {
        warnings.push(`${path}: ${type} cannot have children; children removed.`);
        childrenArray = [];
      }

      if (childConfig?.mode === 'single' && childrenArray.length > 1) {
        warnings.push(`${path}: ${type} allows one child; extra children removed.`);
        childrenArray = [childrenArray[0]];
      }

      if (childConfig?.maxChildren && childrenArray.length > childConfig.maxChildren) {
        warnings.push(
          `${path}: ${type} allows ${childConfig.maxChildren} children; extras removed.`,
        );
        childrenArray = childrenArray.slice(0, childConfig.maxChildren);
      }

      const normalizedChildren = childrenArray
        .map((child, index) => normalizeWidget(child, type, `${path}.children[${index}]`))
        .filter(Boolean) as FlutterWidget[];

      let normalizedTemplate: FlutterWidget | undefined = undefined;
      if (type === 'ListView' && 'itemTemplate' in input) {
        const rawTemplate = (input as { itemTemplate?: unknown }).itemTemplate;
        if (rawTemplate && typeof rawTemplate === 'object') {
          normalizedTemplate = normalizeWidget(
            rawTemplate,
            'ListView',
            `${path}.itemTemplate`,
          ) as FlutterWidget;
        } else if (rawTemplate !== undefined) {
          warnings.push(`${path}.itemTemplate must be an object; ignored.`);
        }
      }

      return {
        id,
        type,
        props: resolvedProps,
        children: normalizedChildren.length > 0 ? normalizedChildren : undefined,
        itemTemplate: normalizedTemplate,
      } as FlutterWidget;
    };

    const normalizedScreens: Screen[] = parsed.map((screen, index) => {
      if (!screen || typeof screen !== 'object') {
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
      const id = typeof rawId === 'string' && rawId.trim() ? rawId : uuidv4();
      if (id !== rawId) warnings.push(`screens[${index}]: missing id, generated.`);

      const rawName = (screen as { name?: unknown }).name;
      const name = typeof rawName === 'string' && rawName.trim() ? rawName : `Screen ${index + 1}`;
      if (name !== rawName) warnings.push(`screens[${index}]: missing name, defaulted.`);

      const rawRoute = (screen as { route?: unknown }).route;
      const route = typeof rawRoute === 'string' && rawRoute.trim() ? rawRoute : toRoute(name);
      if (route !== rawRoute) warnings.push(`screens[${index}]: missing route, generated.`);

      const rawIsHome = (screen as { is_home?: unknown }).is_home;
      const isHome = typeof rawIsHome === 'boolean' ? rawIsHome : !explicitHome && index === 0;
      if (rawIsHome === undefined) {
        warnings.push(`screens[${index}]: missing is_home, defaulted.`);
      }

      const rawComponents = (screen as { components?: unknown }).components;
      const componentsArray = Array.isArray(rawComponents) ? rawComponents : [];
      if (rawComponents !== undefined && !Array.isArray(rawComponents)) {
        warnings.push(`screens[${index}]: components must be an array; ignored invalid value.`);
      }

      const components = componentsArray
        .map((component, compIndex) =>
          normalizeWidget(component, null, `screens[${index}].components[${compIndex}]`),
        )
        .filter(Boolean) as FlutterWidget[];

      return {
        id,
        name,
        route,
        is_home: isHome,
        components,
      } as Screen;
    });

    if (!normalizedScreens.some((screen) => screen.is_home)) {
      normalizedScreens[0].is_home = true;
      warnings.push('No home screen found; first screen set as home.');
    }

    const report = [
      errors.length ? `Errors (${errors.length})\n- ${errors.join('\n- ')}` : 'Errors: none',
      warnings.length
        ? `Warnings (${warnings.length})\n- ${warnings.join('\n- ')}`
        : 'Warnings: none',
    ].join('\n\n');

    setImportErrors(errors);
    setImportWarnings(warnings);
    setImportScreens(normalizedScreens);
    setImportReport(report);
  }, [importText]);

  const applyImportedScreens = useCallback(() => {
    if (!importScreens || importErrors.length > 0) return;
    importProjectData({
      app_name: importAppName.trim() || 'My App',
      package_name: importPackageName.trim() || 'com.example.app',
      screens: importScreens,
    });
    ChooseNotification.success({ message: 'Screens imported to canvas' });
    setImportOpen(false);
  }, [importScreens, importErrors.length, importProjectData, importAppName, importPackageName]);

  const saveImportedProject = useCallback(async () => {
    if (!importScreens || importErrors.length > 0) return;
    try {
      const name = importAppName.trim() || 'My App';
      const payload: IProjectJsonData = {
        app_name: name,
        package_name: importPackageName.trim() || 'com.example.app',
        screens: importScreens,
      };
      const saved = await PROJECT_SERVICE.create({
        name,
        json_data: payload,
      });
      loadProject(saved);
      ChooseNotification.success({ message: 'Project imported and saved' });
      setImportOpen(false);
    } catch (error) {
      ChooseNotification.failure({
        message: error instanceof Error ? error.message : 'Failed to save imported project',
      });
    }
  }, [importScreens, importErrors.length, importAppName, importPackageName, loadProject]);

  const handleGenerateApp = async () => {
    setIsGenerating(true);
    try {
      if (!serverProjectId) {
        throw new Error('Please save the project before generating.');
      }

      // Generate from saved project (no download here)
      const result = await PROJECT_SERVICE.generateFlutterApplication(serverProjectId);

      if (typeof result === 'object' && result && 'status' in result) {
        const status = (result as { status?: string; message?: string }).status;
        const message = (result as { status?: string; message?: string }).message;
        if (status && status !== 'success') {
          throw new Error(message || 'Failed to generate project');
        }
      }

      const blob = await PROJECT_SERVICE.downloadFlutterApplication(serverProjectId);
      downloadBlob(blob, `${project.app_name}.zip`);

      setHasGeneratedProject(true);
      ChooseNotification.success({ message: 'Flutter app generated and downloaded' });
    } catch (error) {
      console.error('Generation error:', error);

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        ChooseNotification.failure({
          message:
            'Cannot connect to backend. This could be a CORS issue or the server is not running. Ensure Django has CORS headers enabled for this origin.',
        });
      } else {
        ChooseNotification.failure({
          message: error instanceof Error ? error.message : 'Failed to generate app.',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuildApk = async () => {
    setIsBuildingApk(true);
    const notificationId = ChooseNotification.loader({ message: 'Generating Flutter project...' });
    try {
      if (!serverProjectId) {
        throw new Error('Please save the project before building APK.');
      }

      // Always generate before building
      const generateResult = await PROJECT_SERVICE.generateFlutterApplication(serverProjectId);

      if (typeof generateResult === 'object' && generateResult && 'status' in generateResult) {
        const status = (generateResult as { status?: string; message?: string }).status;
        const message = (generateResult as { status?: string; message?: string }).message;
        if (status && status !== 'success') {
          throw new Error(message || 'Failed to generate project');
        }
      }

      ChooseNotification.loading({ id: notificationId, message: 'Building APK...' });

      const result = await PROJECT_SERVICE.buildAndroidApplicationPackage(serverProjectId);

      if (typeof result === 'object' && result && 'status' in result) {
        const status = result.status;
        const message = result.message;

        if (status === 'building') {
          ChooseNotification.loadingToSuccess({
            id: notificationId,
            message: message || 'APK build started. This may take a few minutes...',
          });
          // Poll or wait for completion - for now show message
          setIsBuildingApk(false);
          return;
        }

        if (status !== 'success') {
          throw new Error(message || 'Failed to build APK');
        }
      }

      const blob = await PROJECT_SERVICE.downloadAndroidApplicationPackage(serverProjectId);

      downloadBlob(blob, `${project.app_name}.apk`);
      setHasGeneratedProject(true);
      ChooseNotification.loadingToSuccess({
        id: notificationId,
        message: 'APK built and downloaded!',
      });
    } catch (error) {
      console.error('APK build error:', error);

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        ChooseNotification.loadingToFailure({
          id: notificationId,
          message:
            'Cannot connect to backend. This could be a CORS issue or the server is not running.',
        });
      } else {
        ChooseNotification.loadingToFailure({
          id: notificationId,
          message: error instanceof Error ? error.message : 'Failed to build APK.',
        });
      }
    } finally {
      setIsBuildingApk(false);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={styles.topBar}
      >
        <div className={styles.identityGroup}>
          <BrandLogo className={styles.logo} />
          <Divider orientation="vertical" className={styles.divider} />
          <Menu
            opened={screenMenuOpen}
            onChange={setScreenMenuOpen}
            shadow="md"
            width={288}
            position="bottom-start"
          >
            <Menu.Target>
              <Button
                variant="subtle"
                color="gray"
                className={styles.screenSelector}
                rightSection={<ChevronDown size={16} />}
              >
                <span className={styles.screenLabel}>Screen:</span>
                <span className={styles.screenName}>{activeScreen?.name || 'Select'}</span>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {project.screens.map((screen) => (
                <Menu.Item
                  key={screen.id}
                  onClick={() => setActiveScreen(screen.id)}
                  rightSection={
                    <span className={styles.screenMenuMeta}>
                      {screen.is_home && <span className={styles.homeLabel}>Home</span>}
                      {screen.id === activeScreenId && <Check size={16} />}
                    </span>
                  }
                >
                  {screen.name}
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item leftSection={<Plus size={16} />} onClick={handleOpenAddScreenDialog}>
                Add Screen
              </Menu.Item>
              {project.screens.length > 1 && activeScreen && !activeScreen.is_home && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<X size={16} />}
                    onClick={() => deleteScreen(activeScreenId)}
                  >
                    Delete Current Screen
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>

          <Modal
            opened={addScreenDialogOpen}
            onClose={() => {
              setAddScreenDialogOpen(false);
              setNewScreenName('');
            }}
            title="Add Screen"
            centered
            radius="md"
            classNames={{ content: styles.modalContent, header: styles.modalHeader }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddScreen();
              }}
            >
              <Stack gap="lg">
                <TextInput
                  label="Screen name"
                  value={newScreenName}
                  onChange={(event) => setNewScreenName(event.target.value)}
                  placeholder="Checkout"
                  autoFocus
                />
                <Group justify="flex-end">
                  <Button
                    variant="light"
                    type="button"
                    radius="md"
                    className={styles.modalSecondaryButton}
                    onClick={() => setAddScreenDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="light"
                    color="indigo"
                    radius="md"
                    className={styles.modalPrimaryButton}
                    leftSection={<Plus size={16} />}
                    disabled={!newScreenName.trim()}
                  >
                    Create Screen
                  </Button>
                </Group>
              </Stack>
            </form>
          </Modal>
        </div>

        <div className={styles.actions}>
          <ThemeToggle />
          <Tooltip label="Open component and screen specification">
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              className={styles.ghostButton}
              leftSection={<BookOpen size={16} />}
              onClick={() => setSchemaOpen(true)}
            >
              Spec
            </Button>
          </Tooltip>
          <Tooltip label="Import external screen JSON">
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              className={styles.ghostButton}
              leftSection={<Upload size={16} />}
              onClick={() => setImportOpen(true)}
            >
              Import Screens
            </Button>
          </Tooltip>
          <Divider orientation="vertical" className={styles.divider} />
          <Modal
            opened={schemaOpen}
            onClose={() => setSchemaOpen(false)}
            title="Component and screen specification"
            size="xl"
            centered
            radius="md"
            classNames={{ content: styles.modalContent, header: styles.modalHeader }}
          >
            <Stack gap="sm">
              <Textarea
                value={schemaDocument}
                readOnly
                autosize
                minRows={18}
                classNames={{ input: styles.codeArea }}
              />
              <Group justify="flex-end">
                <Button
                  variant="light"
                  color="indigo"
                  radius="md"
                  className={styles.modalPrimaryButton}
                  onClick={() => {
                    navigator.clipboard.writeText(schemaDocument);
                    ChooseNotification.success({ message: 'Specification copied' });
                  }}
                >
                  Copy
                </Button>
              </Group>
            </Stack>
          </Modal>
          <Modal
            opened={importOpen}
            onClose={() => setImportOpen(false)}
            title="Import external screens"
            size="xl"
            centered
            radius="md"
            classNames={{ content: styles.modalContent, header: styles.modalHeader }}
          >
            <Stack gap="md">
              <Textarea
                label="Screens JSON"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder='Paste an array of screens: [{"id":"...","name":"Home","route":"/","is_home":true,"components":[]}]'
                autosize
                minRows={9}
                classNames={{ input: styles.codeArea }}
              />
              <Button
                variant="light"
                color="blue"
                radius="md"
                className={styles.modalPrimaryButton}
                onClick={validateImportedScreens}
              >
                Validate and normalize
              </Button>
              <div className={styles.importGrid}>
                <Stack gap="xs">
                  <Textarea
                    label="Validation report"
                    value={importReport}
                    readOnly
                    autosize
                    minRows={8}
                    placeholder="Run validation to see errors and warnings."
                    classNames={{ input: styles.codeArea }}
                  />
                  <Button
                    variant="light"
                    size="xs"
                    radius="md"
                    color="violet"
                    className={styles.modalSecondaryButton}
                    onClick={() => {
                      if (!importReport) return;
                      navigator.clipboard.writeText(importReport);
                      ChooseNotification.success({ message: 'Report copied' });
                    }}
                  >
                    Copy report
                  </Button>
                </Stack>
                <Stack gap="xs">
                  <Textarea
                    label="Normalized output"
                    value={importScreens ? JSON.stringify(importScreens, null, 2) : ''}
                    readOnly
                    autosize
                    minRows={8}
                    placeholder="Normalized screens will appear here."
                    classNames={{ input: styles.codeArea }}
                  />
                  <Button
                    variant="light"
                    size="xs"
                    radius="md"
                    color="violet"
                    className={styles.modalSecondaryButton}
                    onClick={() => {
                      if (!importScreens) return;
                      navigator.clipboard.writeText(JSON.stringify(importScreens, null, 2));
                      ChooseNotification.success({ message: 'Normalized screens copied' });
                    }}
                  >
                    Copy output
                  </Button>
                </Stack>
              </div>
              <div className={styles.importGrid}>
                <TextInput
                  label="App name"
                  value={importAppName}
                  onChange={(event) => setImportAppName(event.target.value)}
                  placeholder="My App"
                />
                <TextInput
                  label="Package name"
                  value={importPackageName}
                  onChange={(event) => setImportPackageName(event.target.value)}
                  placeholder="com.example.myapp"
                />
              </div>
              <Group justify="space-between">
                <Text size="xs" c={importErrors.length > 0 ? 'red' : 'dimmed'}>
                  {importErrors.length} errors, {importWarnings.length} warnings
                </Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    radius="md"
                    color="teal"
                    className={styles.modalSecondaryButton}
                    onClick={applyImportedScreens}
                    disabled={!importScreens || importErrors.length > 0}
                  >
                    Apply to canvas
                  </Button>
                  <Button
                    variant="light"
                    color="indigo"
                    radius="md"
                    className={styles.modalPrimaryButton}
                    onClick={saveImportedProject}
                    disabled={!importScreens || importErrors.length > 0}
                  >
                    Save project
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Modal>
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            className={styles.ghostButton}
            leftSection={<FolderOpen size={16} />}
            onClick={() => setProjectManagerOpen(true)}
          >
            Projects
          </Button>
          <Button
            variant="subtle"
            color="green"
            size="sm"
            className={styles.ghostButton}
            leftSection={
              isAutoSaving ? <Loader2 size={16} className={styles.spinning} /> : <Save size={16} />
            }
            onClick={() => performSave(true)}
            disabled={!serverProjectId || isAutoSaving}
          >
            {isAutoSaving ? 'Saving...' : autoSaveState === 'saved' ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant={isPreviewOpen ? 'light' : 'subtle'}
            size="sm"
            className={isPreviewOpen ? styles.previewButton : styles.ghostButton}
            leftSection={<MonitorPlay size={16} />}
            onClick={onLaunchPreview}
          >
            {isPreviewOpen ? 'Preview Open' : 'Launch Preview'}
          </Button>
          {serverProjectId && (
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              className={styles.ghostButton}
              leftSection={<FileText size={16} />}
              onClick={() => setLogsOpen(true)}
            >
              Logs
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className={styles.outlineButton}
            leftSection={<Download size={16} />}
            onClick={handleExport}
          >
            Export JSON
          </Button>
          <Button
            size="sm"
            className={styles.generateButton}
            leftSection={
              isGenerating ? <Loader2 size={16} className={styles.spinning} /> : <Play size={16} />
            }
            onClick={handleGenerateApp}
            disabled={isGenerating || isBuildingApk}
          >
            {isGenerating ? 'Generating...' : 'Generate App'}
          </Button>
          <Button
            size="sm"
            variant="default"
            className={styles.outlineButton}
            leftSection={
              isBuildingApk ? (
                <Loader2 size={16} className={styles.spinning} />
              ) : (
                <Package size={16} />
              )
            }
            onClick={handleBuildApk}
            disabled={isGenerating || isBuildingApk}
          >
            {isBuildingApk ? 'Building...' : 'Build APK'}
          </Button>
          <UserProfileMenu />
        </div>

        <ProjectManager open={projectManagerOpen} onOpenChange={setProjectManagerOpen} />
        <GenerationLogs open={logsOpen} onOpenChange={setLogsOpen} />
      </motion.header>
    </>
  );
};
