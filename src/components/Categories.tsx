import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Project } from '../types';
import { Search, Plus, Calendar, Settings, Trash2, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { CategoryDetail } from './CategoryDetail';
import { toast } from 'sonner@2.0.3';

interface ProjectsProps {
  onCategorySelect?: (project: Project) => void;
  onProjectSelect?: (project: Project | null) => void;
  selectedProject?: Project | null;
}

export function Projects({ onCategorySelect, onProjectSelect, selectedProject }: ProjectsProps) {
  const { state, deleteProject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    const filtered = state.projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [state.projects, searchQuery]);

  const handleProjectClick = (project: Project) => {
    onCategorySelect?.(project);
    onProjectSelect?.(project);
  };

  const handleBackToList = () => {
    onProjectSelect?.(null);
  };

  const handleEditProject = (project: Project) => {
    // TODO: Open edit project dialog
    toast.info('Edit project functionality coming soon');
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      deleteProject(projectId);
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getProjectStats = (projectId: string) => {
    const entries = state.entries.filter(entry => (entry.projectId || entry.categoryId) === projectId);
    const reminders = state.reminders.filter(reminder => (reminder.projectId || reminder.categoryId) === projectId);
    const widgets = state.widgets.filter(widget => (widget.projectId || widget.categoryId) === projectId);
    
    return {
      entries: entries.length,
      reminders: reminders.length,
      widgets: widgets.length,
      lastEntry: entries.length > 0 ? entries[entries.length - 1].date : null
    };
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

  // Show project detail if one is selected
  if (selectedProject) {
    return (
      <CategoryDetail
        category={selectedProject}
        onBack={handleBackToList}
        onEdit={handleEditProject}
      />
    );
  }

  if (state.projects.length === 0) {
    return (
      <div className="min-h-screen pt-6 pb-24 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3>No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project to start tracking data
            </p>
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('quickTrack'))}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-24 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your tracking projects
          </p>
        </motion.div>

        {/* Search Bar (only show if more than 10 projects) */}
        {state.projects.length > 10 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-muted-foreground">
              {filteredProjects.length} projects found
            </p>
          </motion.div>
        )}

        {/* Projects List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProjects.map((project, index) => {
              const stats = getProjectStats(project.id);
              // Project icon is an emoji string

              return (
                <div key={project.id}>
                  <Card 
                    className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 backdrop-blur-xl border-white/40 shadow-md"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          <span className="text-xl">{project.icon}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate">{project.name}</h3>
                          {project.description && (
                            <p className="text-muted-foreground text-sm truncate">
                              {project.description}
                            </p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {stats.entries} entries
                            </Badge>
                            {stats.reminders > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {stats.reminders} reminders
                              </Badge>
                            )}
                            {stats.widgets > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {stats.widgets} widgets
                              </Badge>
                            )}
                          </div>

                          {/* Last Entry */}
                          {stats.lastEntry && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Last: {formatDate(stats.lastEntry)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open edit project dialog
                            toast.info('Edit project coming soon');
                          }}>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{project.name}"? This will also delete all entries, reminders, and widgets associated with this project. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* No Results */}
        {searchQuery && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-muted-foreground">No projects found matching "{searchQuery}"</p>
          </motion.div>
        )}

        {/* Create Project Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('quickTrack'))}
            className="w-full bg-primary text-primary-foreground"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
        </motion.div>
      </div>
    </div>
  );
}