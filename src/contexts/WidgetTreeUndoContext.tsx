// Placeholder to ensure context exists if needed for undo/redo snapshots
// (Currently we use builderStore + local refs, but this file was requested)

import React, { createContext, useContext, useRef } from "react";
import { FlutterWidget } from "@/types/flutter";

interface WidgetTreeUndoContextType {
  saveSnapshot: (widgets: FlutterWidget[]) => void;
  getLastSnapshot: () => FlutterWidget[] | null;
  clearSnapshot: () => void;
}

const WidgetTreeUndoContext = createContext<WidgetTreeUndoContextType | null>(
  null,
);

export const WidgetTreeUndoProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const snapshotRef = useRef<FlutterWidget[] | null>(null);

  const saveSnapshot = (widgets: FlutterWidget[]) => {
    // Deep clone
    snapshotRef.current = JSON.parse(JSON.stringify(widgets));
  };

  const getLastSnapshot = () => snapshotRef.current;

  const clearSnapshot = () => {
    snapshotRef.current = null;
  };

  return (
    <WidgetTreeUndoContext.Provider
      value={{ saveSnapshot, getLastSnapshot, clearSnapshot }}
    >
      {children}
    </WidgetTreeUndoContext.Provider>
  );
};

export const useWidgetTreeUndo = () => {
  const context = useContext(WidgetTreeUndoContext);
  if (!context) {
    // Fallback or throw, but for now we can just rely on the store approach if context is missing
    // or return a dummy implementation to avoid crashes
    return {
      saveSnapshot: () => {},
      getLastSnapshot: () => null,
      clearSnapshot: () => {},
    };
  }
  return context;
};
