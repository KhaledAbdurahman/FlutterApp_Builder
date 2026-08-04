import { useState } from 'react';
import { Boxes, Network } from 'lucide-react';
import { WidgetPalette } from '@/pages/builder/components/widget-palette';
import { WidgetTree } from '@/pages/builder/components/widget-tree';
import { cn } from '@/lib/utils';

const BuilderSidebar = () => {
  const [activeView, setActiveView] = useState<'widgets' | 'tree'>('widgets');

  return (
    <aside className="flex h-full w-full min-w-0 flex-col bg-card">
      <div className="border-b border-border px-3 py-3">
        <div
          className="flex h-9 items-center bg-muted p-1"
          role="tablist"
          aria-label="Builder sidebar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'widgets'}
            onClick={() => setActiveView('widgets')}
            className={cn(
              'flex h-full flex-1 items-center justify-center gap-2 text-xs font-medium transition-colors',
              activeView === 'widgets'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Boxes className="h-3.5 w-3.5" />
            Widgets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'tree'}
            onClick={() => setActiveView('tree')}
            className={cn(
              'flex h-full flex-1 items-center justify-center gap-2 text-xs font-medium transition-colors',
              activeView === 'tree'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Network className="h-3.5 w-3.5" />
            Tree
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeView === 'widgets' ? <WidgetPalette embedded /> : <WidgetTree embedded />}
      </div>
    </aside>
  );
};

export { BuilderSidebar };
