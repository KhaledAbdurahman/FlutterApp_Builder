import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/builderStore";
import { stopPreview } from "@/lib/api";
import { toast } from "sonner";

interface LivePreviewProps {
  previewUrl: string;
  onClose: () => void;
}

export const LivePreview = ({ previewUrl, onClose }: LivePreviewProps) => {
  const { serverProjectId } = useBuilderStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleStop = async () => {
    if (!serverProjectId) {
      onClose();
      return;
    }

    try {
      await stopPreview(serverProjectId);
      toast.success("Preview stopped");
      onClose();
    } catch (error) {
      console.error("Failed to stop preview:", error);
      // Still close even if stop fails
      onClose();
    }
  };

  const handleOpenExternal = () => {
    window.open(previewUrl, "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 ${
          isFullscreen ? "p-0" : ""
        }`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-card border border-border rounded-xl shadow-elevated overflow-hidden flex flex-col ${
            isFullscreen
              ? "w-full h-full rounded-none"
              : "w-[450px] h-[850px] max-h-[90vh]"
          }`}
        >
          {/* Header */}
          <div className="h-12 border-b border-border bg-muted/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenExternal}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleStop}
                title="Stop preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative bg-background">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Loading Flutter Preview...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take a moment
                  </p>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title="Flutter Live Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Footer */}
          <div className="h-8 border-t border-border bg-muted/30 flex items-center justify-center px-4">
            <span className="text-xs text-muted-foreground truncate max-w-full">
              {previewUrl}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
