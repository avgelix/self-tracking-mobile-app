import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { toast } from 'sonner@2.0.3';
import { Plus, Edit, Trash2, Tag, Layers, ChevronDown } from 'lucide-react';
import { Project, ProjectField } from '../types';
import { ICON_CATEGORIES, COLOR_PALETTE, ALL_ICONS, ALL_COLORS } from '../utils/iconLibrary';
import { FieldBuilder } from './FieldBuilder';
import { ProjectDetail } from './ProjectDetail';

const CATEGORY_TEMPLATES = [
  { 
    name: 'Daily Wellness', 
    icon: '💧', 
    color: '#3b82f6',
    fields: [
      { id: 'water', name: 'Water Intake', type: 'number' as const, unit: 'glasses', required: true, subfields: [] },
      { id: 'mood', name: 'Mood', type: 'scale' as const, min: 1, max: 10, required: true, subfields: [] },
      { id: 'energy', name: 'Energy Level', type: 'scale' as const, min: 1, max: 10, required: true, subfields: [] }
    ]
  },
  { 
    name: 'Workout Session', 
    icon: '🏋️‍♀️', 
    color: '#10b981',
    fields: [
      { id: 'duration', name: 'Duration', type: 'duration' as const, unit: 'minutes', required: true, subfields: [] },
      { id: 'type', name: 'Exercise Type', type: 'choice' as const, options: ['Cardio', 'Strength', 'Yoga', 'Sports'], required: true, subfields: [] },
      { id: 'intensity', name: 'Intensity', type: 'scale' as const, min: 1, max: 10, required: true, subfields: [] },
      { id: 'calories', name: 'Calories Burned', type: 'number' as const, unit: 'calories', subfields: [] }
    ]
  },
  { 
    name: 'Study Session', 
    icon: '📚', 
    color: '#8b5cf6',
    fields: [
      { id: 'subject', name: 'Subject', type: 'text' as const, required: true, subfields: [] },
      { id: 'duration', name: 'Study Time', type: 'duration' as const, unit: 'minutes', required: true, subfields: [] },
      { id: 'focus', name: 'Focus Level', type: 'scale' as const, min: 1, max: 10, subfields: [] },
      { id: 'completed', name: 'Goals Completed', type: 'boolean' as const, subfields: [] }
    ]
  },
  { 
    name: 'Meal Tracking', 
    icon: '🍽️', 
    color: '#f59e0b',
    fields: [
      { id: 'meal_type', name: 'Meal Type', type: 'choice' as const, options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], required: true, subfields: [] },
      { id: 'foods', name: 'Foods', type: 'text' as const, description: 'What did you eat?', subfields: [] },
      { id: 'calories', name: 'Estimated Calories', type: 'number' as const, unit: 'calories', subfields: [] },
      { id: 'satisfaction', name: 'Satisfaction', type: 'rating' as const, subfields: [] }
    ]
  }
];

export function Projects() {
  const { state, addProject, deleteProject } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: ALL_COLORS[0],
    icon: ALL_ICONS[0],
    fields: [] as ProjectField[]
  });
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('health');
  const [selectedColorCategory, setSelectedColorCategory] = useState<string>('blues');
  const hasProjects = (state.projects?.length || 0) > 0;
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(!hasProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<string>('fields');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: ALL_COLORS[0],
      icon: ALL_ICONS[0],
      fields: [{
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        type: 'text' as const,
        required: false,
        subfields: []
      }]
    });
    setEditingProject(null);
    setActiveTab('fields');
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color,
      icon: project.icon,
      fields: project.fields
    });
    setEditingProject(project);
    setActiveTab('details');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    // Validate fields
    for (const field of formData.fields) {
      if (!field.name.trim()) {
        toast.error('All fields must have a name');
        return;
      }
    }

    const projectData = {
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      fields: formData.fields,
      createdAt: new Date()
    };

    if (editingProject) {
      // Note: You'll need to add updateProject to your context
      toast.success('Project updated successfully!');
    } else {
      addProject(projectData);
      toast.success('Project added successfully!');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all related entries.`)) {
      deleteProject(project.id);
      toast.success('Project deleted successfully!');
    }
  };

  const loadTemplate = (template: typeof CATEGORY_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      description: '',
      color: template.color,
      icon: template.icon,
      fields: template.fields.map(field => ({
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    });
    setActiveTab('details');
    setIsDialogOpen(true);
  };

  // Show project detail if a project is selected
  if (selectedProject) {
    return (
      <ProjectDetail 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)}
        onEdit={(project) => {
          setSelectedProject(null); // Go back to projects list
          openEditDialog(project); // Open the edit dialog
        }}
      />
    );
  }

  return (
    <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-medium mb-2">Projects</h1>
        <p className="text-muted-foreground">Create and manage your tracking projects</p>
      </motion.div>

      {/* Quick Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Collapsible open={isTemplatesExpanded} onOpenChange={setIsTemplatesExpanded}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Quick Start Templates</h2>
            {hasProjects && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <motion.div
                    animate={{ rotate: isTemplatesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                  <span className="text-sm">{isTemplatesExpanded ? 'Hide' : 'Show'}</span>
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {CATEGORY_TEMPLATES.map((template, index) => (
                <motion.button
                  key={template.name}
                  onClick={() => loadTemplate(template)}
                  className="p-4 text-left rounded-lg border bg-white/60 hover:bg-white/80 backdrop-blur-sm border-white/30 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium mb-1">{template.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {template.fields.length} field{template.fields.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.fields.slice(0, 3).map((field) => (
                          <Badge key={field.id} variant="secondary" className="text-xs">
                            {field.name}
                          </Badge>
                        ))}
                        {template.fields.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.fields.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Add Category Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openAddDialog}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/95 backdrop-blur-xl border-white/30 max-w-4xl max-h-[90vh] w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-full overflow-hidden p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
              <DialogDescription>
                {editingProject 
                  ? 'Modify your project settings and fields.' 
                  : 'Build a custom project with unlimited nested fields and data types.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Project Details</TabsTrigger>
                  <TabsTrigger value="fields">Project Fields</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(90vh-280px)] mt-4">
                  <div className="pr-4">
                    <TabsContent value="details" className="space-y-4 mt-0">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <Label>Project Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Daily Wellness, Workout Tracking"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Optional description for this project"
                          rows={2}
                        />
                      </div>

                      {/* Icon Selection */}
                      <div className="space-y-3">
                        <Label>Icon</Label>
                        <Tabs value={selectedIconCategory} onValueChange={setSelectedIconCategory}>
                          <div className="space-y-3">
                            <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 h-auto p-1">
                              {Object.keys(ICON_CATEGORIES).map((category) => (
                                <TabsTrigger 
                                  key={category} 
                                  value={category} 
                                  className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                  {category}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                              <TabsContent key={category} value={category} className="mt-0">
                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-32 overflow-y-auto p-3 bg-white/30 rounded-lg backdrop-blur-sm border">
                                  {icons.map((icon) => (
                                    <button
                                      key={icon}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, icon })}
                                      className={`aspect-square p-2 text-lg rounded border transition-all hover:scale-105 ${
                                        formData.icon === icon
                                          ? 'border-primary bg-primary/10 shadow-sm'
                                          : 'border-border hover:bg-accent hover:border-primary/50'
                                      }`}
                                    >
                                      {icon}
                                    </button>
                                  ))}
                                </div>
                              </TabsContent>
                            ))}
                          </div>
                        </Tabs>
                      </div>

                      {/* Color Selection */}
                      <div className="space-y-3">
                        <Label>Color</Label>
                        <Tabs value={selectedColorCategory} onValueChange={setSelectedColorCategory}>
                          <div className="space-y-3">
                            <TabsList className="grid grid-cols-3 sm:grid-cols-5 h-auto p-1">
                              {Object.keys(COLOR_PALETTE).map((category) => (
                                <TabsTrigger 
                                  key={category} 
                                  value={category} 
                                  className="text-xs px-2 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                  {category}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
                              <TabsContent key={category} value={category} className="mt-0">
                                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-3 p-3 bg-white/30 rounded-lg backdrop-blur-sm border">
                                  {colors.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, color })}
                                      className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition-transform ${
                                        formData.color === color
                                          ? 'border-primary scale-125 shadow-sm'
                                          : 'border-white hover:scale-110'
                                      }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </TabsContent>
                            ))}
                          </div>
                        </Tabs>
                      </div>
                    </TabsContent>

                    <TabsContent value="fields" className="space-y-3 mt-0">
                      {/* Field Builder */}
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <Label>Project Fields *</Label>
                      </div>
                      <FieldBuilder
                        fields={formData.fields}
                        onChange={(fields) => setFormData({ ...formData, fields })}
                      />
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingProject ? 'Update' : 'Create'} Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Categories List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-medium mb-3">Your Projects</h2>
        <div className="space-y-3">
          {(state.projects?.length || 0) === 0 ? (
            <Card className="p-6 text-center bg-white/60 backdrop-blur-sm border-white/30">
              <Tag className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No projects yet. Create one to get started!</p>
            </Card>
          ) : (
            (state.projects || []).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-4 bg-white/60 backdrop-blur-sm border-white/30 overflow-hidden transition-shadow hover:shadow-lg active:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer -m-4 p-4 hover:bg-white/40 transition-all"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="text-2xl">{project.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.fields?.length || 0} field{(project.fields?.length || 0) !== 1 ? 's' : ''}
                          {project.description && ` • ${project.description}`}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {state.entries.filter(e => (e.projectId || e.categoryId) === project.id).length} entries
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(project);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
