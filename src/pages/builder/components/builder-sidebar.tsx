import { useState } from 'react';
import { Boxes, Network } from 'lucide-react';
import { SegmentedControl } from '@mantine/core';
import { WidgetPalette } from '@/pages/builder/components/widget-palette';
import { WidgetTree } from '@/pages/builder/components/widget-tree';
import styles from '@/pages/builder/components/builder-sidebar.module.css';

const BuilderSidebar = () => {
  const [activeView, setActiveView] = useState<'widgets' | 'tree'>('widgets');

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <SegmentedControl
          value={activeView}
          onChange={(value) => setActiveView(value as 'widgets' | 'tree')}
          fullWidth
          data={[
            {
              value: 'widgets',
              label: (
                <span className={styles.tabLabel}>
                  <Boxes size={15} />
                  Widgets
                </span>
              ),
            },
            {
              value: 'tree',
              label: (
                <span className={styles.tabLabel}>
                  <Network size={15} />
                  Tree
                </span>
              ),
            },
          ]}
        />
      </div>
      <div className={styles.content}>
        {activeView === 'widgets' ? <WidgetPalette embedded /> : <WidgetTree embedded />}
      </div>
    </aside>
  );
};

export { BuilderSidebar };
