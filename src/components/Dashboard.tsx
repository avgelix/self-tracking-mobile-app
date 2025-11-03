import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Trash2, TrendingUp, Plus, Bell, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { HomeScreenWidgets } from './HomeScreenWidgets';
import { QuickStartGuide } from './QuickStartGuide';
import { Badge } from './ui/badge';
import { format, isToday, isTomorrow } from '../utils/dateHelpers';

export function Dashboard() {
  const { state, deleteEntry } = useApp();
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Get recent entries (last 7 days)
  const recentEntries = state.entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Get today's entries count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = state.entries.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  // Calculate streak (consecutive days with entries)
  const calculateStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const hasEntry = state.entries.some(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === currentDate.getTime();
      });

      if (hasEntry) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Get active reminders
  const activeReminders = state.reminders.filter(r => r.isActive);
  const upcomingReminders = activeReminders
    .filter(r => r.nextDue > new Date())
    .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
    .slice(0, 3);

  // Get pending notifications
  const pendingNotifications = state.pendingNotifications.filter(
    n => !n.delivered && !n.dismissed
  );

  // Check if user should see quick start guide
  const shouldShowQuickStart = showQuickStart && (
    state.projects.length === 0 || 
    (state.reminders.length === 0 && state.widgets.length === 0)
  );

  const handleNavigateToSettings = (section: string) => {
    window.dispatchEvent(new CustomEvent('openSettings'));
    // You might want to pass the section to open specific tab
    setShowQuickStart(false);
  };

  const formatValue = (entry: any) => {
    const project = state.projects.find(proj => proj.id === (entry.projectId || entry.categoryId));
    if (!project) return 'Unknown';
    
    // Handle new nested field structure
    if (entry.values && entry.values.length > 0) {
      // Get the first field's value for display
      const firstValue = entry.values[0];
      const field = project.fields?.find(f => f.id === firstValue.fieldId);
      
      if (!field || firstValue.value === undefined) return 'No data';
      
      const value = firstValue.value;
      
      switch (field.type) {
        case 'boolean':
          return value ? 'Yes' : 'No';
        case 'scale':
        case 'rating':
          return `${value}${field.unit || ''}`;
        case 'duration':
          const hours = Math.floor(value / 60);
          const minutes = value % 60;
          if (hours > 0) {
            return `${hours}h ${minutes}m`;
          }
          return `${minutes}m`;
        case 'choice':
        case 'multi_choice':
          return Array.isArray(value) ? value.join(', ') : value;
        case 'number':
          return `${value} ${field.unit || ''}`;
        default:
          return value?.toString() || 'No data';
      }
    }
    
    // Fallback for legacy entries
    if (entry.value !== undefined) {
      return entry.value.toString();
    }
    
    return 'No data';
  };

  // Show getting started screen if no projects
  if (state.projects.length === 0) {
    return (
      <div className="flex items-center justify-center pt-[30px] pr-[14px] pb-[14px] pl-[14px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Card 
            className="p-6 text-center bg-white/60 backdrop-blur-sm border-white/30 cursor-pointer hover:bg-white/80 transition-colors"
            onClick={() => {
              const event = new CustomEvent('navigateToTab', { detail: { tab: 'projects' } });
              window.dispatchEvent(event);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const event = new CustomEvent('navigateToTab', { detail: { tab: 'projects' } });
                window.dispatchEvent(event);
              }
            }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full text-blue-500 shadow-[0_4px_16px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] transition-shadow">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-muted-foreground">No projects yet. Create one to get started!</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-[112px] pt-[32px] pr-[20px] pl-[20px]">
      {/* Section Heading */}
      <h2 className="mb-4 font-semibold font-bold font-normal">Your most active projects</h2>
      
      {/* Project List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {state.projects.map((project, index) => {
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="relative overflow-hidden cursor-pointer transition-all hover:shadow-md bg-white border-gray-200"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('quickTrack', { detail: { projectId: project.id } }));
                }}
              >
                {/* Colored top border */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: project.color }}
                />
                
                <div className="p-4 pt-5">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {project.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-medium mb-0.5">{project.name}</h3>
                      <div className="text-sm text-muted-foreground mb-2">
                        {project.fields?.length || 0} field{(project.fields?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>Tap to start tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Entries Section - Only show if there are entries */}
      {recentEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="mb-4 font-semibold">Recent Entries</h2>
          <div className="space-y-3">
            {recentEntries.map((entry, index) => {
              const project = state.projects.find(p => p.id === (entry.projectId || entry.categoryId));
              if (!project) return null;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="p-3 bg-white/90 backdrop-blur-xl border-white/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Project Icon */}
                        <div className="text-2xl flex-shrink-0">
                          {project.icon}
                        </div>
                        
                        {/* Entry Details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{project.name}</div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {formatValue(entry)}
                          </div>
                          <div className="text-xs text-muted-foreground/60">
                            {format(new Date(entry.date))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}