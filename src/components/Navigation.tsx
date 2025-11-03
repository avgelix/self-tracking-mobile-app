import { motion } from 'motion/react';
import { Home, Plus, BarChart3, Settings, Folder } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'projects', icon: Folder, label: 'Projects' },
  { id: 'entries', icon: Plus, label: 'Entries' },
  { id: 'charts', icon: BarChart3, label: 'Analytics' },
  { id: 'settings', icon: Settings, label: 'Settings' }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  
  // Color mapping for each tab
  const tabColors = {
    home: '#3b82f6',      // blue-500
    entries: '#10b981',    // green-500
    charts: '#f59e0b',     // amber-500
    projects: '#8b5cf6',   // violet-500
    settings: '#6b7280'    // gray-500
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative">
        {/* Main navigation bar with curved top */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl overflow-visible border-t border-gray-200">
          {/* Bubble effect for active tab */}
          {activeTab && activeIndex !== -1 && (
            <div
              className="absolute rounded-full w-16 h-16 shadow-xl pointer-events-none transition-all duration-500 ease-out"
              style={{
                left: `calc(${(activeIndex + 0.5) * (100 / tabs.length)}% - 2rem)`,
                top: '-1rem',
                backgroundColor: tabColors[activeTab as keyof typeof tabColors]
              }}
            />
          )}
          
          <div className="flex items-center relative z-10 py-4 pb-6">
            {tabs.map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id;
              const color = tabColors[id as keyof typeof tabColors];
              
              return (
                <motion.button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="flex-1 flex flex-col items-center gap-1 relative"
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    y: isActive ? -12 : 0,
                  }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                >
                  <Icon 
                    className="w-6 h-6 relative z-10 transition-colors"
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ 
                      color: isActive ? 'white' : color,
                      opacity: isActive ? 1 : 0.7
                    }}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}