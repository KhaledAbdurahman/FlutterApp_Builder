import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getProjectLogs, GenerationLog } from '@/lib/api';
import { useBuilderStore } from '@/store/builderStore';
import { format } from 'date-fns';

interface GenerationLogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getLevelIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'success':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const getLevelBadge = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return <Badge variant="destructive">{level}</Badge>;
    case 'warning':
      return <Badge className="bg-amber-500">{level}</Badge>;
    case 'success':
      return <Badge className="bg-emerald-500">{level}</Badge>;
    default:
      return <Badge variant="secondary">{level}</Badge>;
  }
};

export const GenerationLogs = ({ open, onOpenChange }: GenerationLogsProps) => {
  const { serverProjectId } = useBuilderStore();
  
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!serverProjectId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjectLogs(serverProjectId);
      setLogs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load logs';
      setError(message);
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && serverProjectId) {
      fetchLogs();
    }
  }, [open, serverProjectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generation Logs</DialogTitle>
          <DialogDescription>
            View the generation history and logs for this project.
          </DialogDescription>
        </DialogHeader>

        {!serverProjectId ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Save your project first to view generation logs</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {logs.length} log(s) found
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive mb-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <ScrollArea className="h-[400px] pr-4">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No generation logs yet</p>
                    <p className="text-xs mt-1">Generate your app to see logs here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {getLevelIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getLevelBadge(log.level)}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), 'PPp')}
                              </span>
                            </div>
                            <p className="text-sm">{log.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
