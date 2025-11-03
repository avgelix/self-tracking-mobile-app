import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Project, Entry, FieldType } from '../types';
import { ProjectEditor } from './ProjectEditor';
import { ProjectReminderManager } from './ProjectReminderManager';
import { ProjectWidgetManager } from './ProjectWidgetManager';
import { 
  ArrowLeft, 
  Calendar, 
  Edit3, 
  Trash2, 
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  Settings,
  Bell,
  Layout
} from 'lucide-react';
// Icons are stored as emoji strings
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onEdit?: (project: Project) => void;
}

type SortOption = 'newest' | 'oldest' | 'field';

export function ProjectDetail({ project, onBack, onEdit }: ProjectDetailProps) {
  const { state, deleteEntry, deleteProject } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterField, setFilterField] = useState<string>('all');
  
  // Dialog states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isReminderManagerOpen, setIsReminderManagerOpen] = useState(false);
  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);

  // Project icon is an emoji string

  // Get entries for this project
  useEffect(() => {
    const projectEntries = state.entries.filter(entry => 
      entry.projectId === project.id || entry.categoryId === project.id
    );
    setEntries(projectEntries);
  }, [state.entries, project.id]);

  // Filter and sort entries
  useEffect(() => {
    let filtered = [...entries];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(entry => {
        return entry.values.some(value => {
          const stringValue = String(value.value).toLowerCase();
          return stringValue.includes(searchQuery.toLowerCase());
        }) || entry.note?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply field filter
    if (filterField !== 'all') {
      filtered = filtered.filter(entry => 
        entry.values.some(value => value.fieldId === filterField)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.date.getTime() - a.date.getTime();
        case 'oldest':
          return a.date.getTime() - b.date.getTime();
        case 'field':
          // Sort by first field value
          const aValue = a.values[0]?.value || '';
          const bValue = b.values[0]?.value || '';
          return String(aValue).localeCompare(String(bValue));
        default:
          return 0;
      }
    });

    setFilteredEntries(filtered);
  }, [entries, searchQuery, sortBy, filterField]);

  const handleDeleteEntry = async (entryId: string) => {
    try {
      deleteEntry(entryId);
      toast.success('Entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleDeleteProject = async () => {
    try {
      deleteProject(project.id);
      toast.success('Project deleted successfully');
      onBack();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const formatFieldValue = (value: any, fieldType: FieldType) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (fieldType) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'time':
        return new Date(value).toLocaleTimeString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'duration':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      case 'scale':
      case 'rating':
        return `${value}/10`;
      case 'multi_choice':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  };

  const getFieldName = (fieldId: string) => {
    const field = project.fields.find(f => f.id === fieldId);
    return field?.name || 'Unknown Field';
  };

  const getFieldType = (fieldId: string) => {
    const field = project.fields.find(f => f.id === fieldId);
    return field?.type || 'text';
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getProjectStats = () => {
    const reminders = state.reminders.filter(reminder => (reminder.projectId || reminder.categoryId) === project.id);
    const widgets = state.widgets.filter(widget => (widget.projectId || widget.categoryId) === project.id);
    
    return {
      entries: entries.length,
      reminders: reminders.length,
      widgets: widgets.length
    };
  };

  const stats = getProjectStats();

  return (
    <div className="min-h-screen pt-6 pb-24 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <span className="text-2xl">{project.icon}</span>
            </div>
            <div className="flex-1">
              <h1 className="truncate">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground text-sm">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Interactive Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Entries Card */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-4 text-center shadow-lg">
              <div className="text-2xl font-semibold text-primary">{stats.entries}</div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>

            {/* Edit Project Button */}
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(project);
                } else {
                  setIsEditorOpen(true);
                }
              }}
              className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-4 text-center hover:bg-white/95 transition-colors shadow-lg"
            >
              <Edit3 className="w-6 h-6 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">Edit Project</div>
            </button>

            {/* Reminders Button */}
            <button
              onClick={() => setIsReminderManagerOpen(true)}
              className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-4 text-center hover:bg-white/95 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Bell className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold text-primary">{stats.reminders}</span>
              </div>
              <div className="text-sm font-medium">Reminders</div>
            </button>

            {/* Widgets Button */}
            <button
              onClick={() => setIsWidgetManagerOpen(true)}
              className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-4 text-center hover:bg-white/95 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Layout className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold text-primary">{stats.widgets}</span>
              </div>
              <div className="text-sm font-medium">Widgets</div>
            </button>
          </div>

          {/* Delete Project Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center hover:bg-destructive/20 transition-colors">
                <div className="flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Delete Project</span>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{project.name}"? This will also delete all {stats.entries} entries, {stats.reminders} reminders, and {stats.widgets} widgets. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-6"
        >
          {/* Search */}
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filters and Sort */}
          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center">
                    <SortDesc className="w-4 h-4 mr-2" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center">
                    <SortAsc className="w-4 h-4 mr-2" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="field">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    By Value
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterField} onValueChange={setFilterField}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {project.fields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.4)]" style={{ color: '#10b981' }}>
              <Plus className="w-8 h-8" />
            </div>
            <h3>No Entries Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking data for this project
            </p>
            <Button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('quickTrack', { detail: { categoryId: project.id } }));
              }}
              style={{ backgroundColor: '#10b981', color: 'white' }}
              className="hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Entry
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Results Count */}
            {searchQuery && (
              <p className="text-muted-foreground text-sm">
                {filteredEntries.length} of {entries.length} entries
              </p>
            )}

            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <div key={entry.id}>
                  <Card className="p-4 bg-white/90 backdrop-blur-xl border-white/40 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Date */}
                        <div className="flex items-center space-x-1 mb-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.date)} at {entry.date.toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Field Values */}
                        <div className="space-y-2">
                          {entry.values.map(value => (
                            <div key={value.fieldId} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {getFieldName(value.fieldId)}:
                              </span>
                              <span className="text-sm font-medium">
                                {formatFieldValue(value.value, getFieldType(value.fieldId))}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Note */}
                        {entry.note && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            {entry.note}
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1 h-6 w-6 ml-2">
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                </div>
              ))}
            </AnimatePresence>

            {/* No Results */}
            {searchQuery && filteredEntries.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-muted-foreground">No entries found matching "{searchQuery}"</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Add Entry Button */}
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('quickTrack', { detail: { categoryId: project.id } }));
              }}
              className="w-full hover:opacity-90"
              style={{ backgroundColor: '#10b981', color: 'white' }}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Entry
            </Button>
          </motion.div>
        )}

        {/* Project Management Dialogs */}
        <ProjectEditor
          project={project}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
        
        <ProjectReminderManager
          project={project}
          isOpen={isReminderManagerOpen}
          onClose={() => setIsReminderManagerOpen(false)}
        />
        
        <ProjectWidgetManager
          project={project}
          isOpen={isWidgetManagerOpen}
          onClose={() => setIsWidgetManagerOpen(false)}
        />
      </div>
    </div>
  );
}