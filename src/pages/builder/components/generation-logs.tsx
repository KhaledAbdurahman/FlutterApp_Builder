import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
  Loader2,
  Monitor,
  Package,
  Play,
  RefreshCw,
} from 'lucide-react';
import { Alert, Badge, Button, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { format, isValid } from 'date-fns';
import { PROJECT_SERVICE } from '@/api/projects';
import { useBuilderStore } from '@/stores/builder/use-builder-store';
import type { IProjectGenerationLog } from '@/types/api/project-types';
import styles from '@/pages/builder/components/generation-logs.module.css';

interface IGenerationLogsProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export const GenerationLogs = ({ onOpenChange, open }: IGenerationLogsProps) => {
  const { serverProjectId } = useBuilderStore();
  const [logs, setLogs] = useState<IProjectGenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!serverProjectId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await PROJECT_SERVICE.getGenerationLogs(serverProjectId);
      setLogs(data.logs);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to load logs';
      setError(message);
      console.error('Failed to fetch logs:', requestError);
    } finally {
      setIsLoading(false);
    }
  }, [serverProjectId]);

  useEffect(() => {
    if (open && serverProjectId) {
      void fetchLogs();
    }
  }, [fetchLogs, open, serverProjectId]);

  return (
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
      title="Generation logs"
      onClose={() => onOpenChange(false)}
    >
      <div className={styles.dialogLayout}>
        <Text className={styles.modalDescription} size="sm">
          Review generation, preview, and build activity for the current project.
        </Text>

        {!serverProjectId ? (
          <EmptyState message="Save your project first to view generation logs" />
        ) : (
          <>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.logToolbar}
              initial={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              <div>
                <Text className={styles.listHeading}>Activity feed</Text>
                <Text c="dimmed" size="xs">
                  {logs.length} log(s) recorded for this project
                </Text>
              </div>
              <Button
                leftSection={
                  <RefreshCw className={isLoading ? styles.spinningIcon : undefined} size={15} />
                }
                loading={isLoading}
                size="xs"
                variant="light"
                onClick={() => void fetchLogs()}
              >
                Refresh
              </Button>
            </motion.div>

            {error && (
              <Alert className={styles.errorAlert} color="red" icon={<AlertCircle size={16} />}>
                {error}
              </Alert>
            )}

            <ScrollArea className={styles.logsScrollArea} type="auto">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <LoadingState />
                ) : logs.length === 0 ? (
                  <EmptyState message="No generation logs yet" />
                ) : (
                  <Stack gap="xs">
                    {logs.map((log, index) => (
                      <motion.div
                        key={`${log.step || 'log'}-${log.timestamp || index}-${index}`}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${styles.logCard} ${getStatusCardClass(log.status)}`}
                        exit={{ opacity: 0, scale: 0.95 }}
                        initial={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.16 }}
                        whileHover={{ x: 2 }}
                      >
                        <Group align="flex-start" gap="sm" wrap="nowrap">
                          {getStatusIcon(log.status)}
                          <div className={styles.logDetails}>
                            <Group className={styles.logMeta} gap="xs">
                              {getStatusBadge(log.status)}
                              <span className={styles.logStep}>
                                {getStepIcon(log.step)}
                                {log.step || 'unknown_step'}
                              </span>
                              <span className={styles.logTimestamp}>
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </Group>
                            <Text className={styles.logMessage} size="sm">
                              {log.message}
                            </Text>
                          </div>
                        </Group>
                      </motion.div>
                    ))}
                  </Stack>
                )}
              </AnimatePresence>
            </ScrollArea>
          </>
        )}
      </div>
    </Modal>
  );
};

const LoadingState = () => (
  <div className={styles.loadingState}>
    <Loader2 className={styles.loadingIcon} />
    <Text c="dimmed" size="sm">
      Loading generation logs
    </Text>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className={styles.emptyState}>
    <FileText className={styles.emptyStateIcon} />
    <Text c="dimmed" size="sm">
      {message}
    </Text>
  </div>
);

const getStatusCardClass = (status?: string): string => {
  switch ((status || 'info').toLowerCase()) {
    case 'error':
      return styles.logCardError;
    case 'warning':
      return styles.logCardWarning;
    case 'success':
      return styles.logCardSuccess;
    default:
      return styles.logCardInfo;
  }
};

const getStatusIcon = (status?: string) => {
  const className = styles.logStatusIcon;

  switch ((status || 'info').toLowerCase()) {
    case 'error':
      return <AlertCircle className={`${className} ${styles.statusError}`} />;
    case 'warning':
      return <AlertTriangle className={`${className} ${styles.statusWarning}`} />;
    case 'success':
      return <CheckCircle className={`${className} ${styles.statusSuccess}`} />;
    default:
      return <Info className={`${className} ${styles.statusInfo}`} />;
  }
};

const getStatusBadge = (status?: string) => {
  const value = (status || 'info').toLowerCase();

  switch (value) {
    case 'error':
      return (
        <Badge color="red" size="xs" variant="light">
          {value}
        </Badge>
      );
    case 'warning':
      return (
        <Badge color="yellow" size="xs" variant="light">
          {value}
        </Badge>
      );
    case 'success':
      return (
        <Badge color="green" size="xs" variant="light">
          {value}
        </Badge>
      );
    default:
      return (
        <Badge color="blue" size="xs" variant="light">
          {value}
        </Badge>
      );
  }
};

const getStepIcon = (step?: string) => {
  const normalized = (step || '').toLowerCase();
  const className = styles.logStepIcon;

  if (normalized.includes('start')) return <Play className={className} />;
  if (normalized.includes('build_apk')) return <Package className={className} />;
  if (normalized.includes('preview')) return <Monitor className={className} />;
  if (normalized.includes('generate')) return <FileText className={className} />;
  return <Info className={className} />;
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  if (!isValid(date)) return 'Unknown time';
  return format(date, 'PPp');
};
