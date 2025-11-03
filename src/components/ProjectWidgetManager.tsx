import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Project, Widget, FieldType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Smartphone, Plus, Edit, Trash2, Grip, Eye, Settings, Zap } from 'lucide-react';
import { ALL_ICONS, COLOR_OPTIONS } from '../utils/iconLibrary';
import { toast } from 'sonner@2.0.3';

interface ProjectWidgetManagerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const colorOptions = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Gray', value: 'gray', class: 'bg-gray-500' },
];

export function ProjectWidgetManager({ project, isOpen, onClose }: ProjectWidgetManagerProps) {
  const { state, addWidget, updateWidget, deleteWidget } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [newWidget, setNewWidget] = useState<Partial<Widget>>({
    projectId: project.id,
    categoryId: project.id, // Backward compatibility
    fieldId: '',
    name: '',
    type: 'number',
    position: { x: 0, y: 0 },
    size: 'medium',
    isEnabled: true,
    quickEntryEnabled: true,
    displayStyle: 'detailed',
    color: 'blue',
    icon: '📊'
  });

  // Filter widgets for this project only
  const projectWidgets = state.widgets.filter(w => (w.projectId || w.categoryId) === project.id);

  const handleCreateWidget = () => {
    if (!newWidget.fieldId || !newWidget.name) {
      toast.error('Widget name and field are required');
      return;
    }

    const widgetToAdd = {
      ...newWidget,
      projectId: project.id,
      categoryId: project.id // Backward compatibility
    } as Omit<Widget, 'id'>;
    
    addWidget(widgetToAdd);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success('Widget created successfully');
  };

  const handleUpdateWidget = () => {
    if (!editingWidget) return;

    updateWidget(editingWidget.id, newWidget);
    setEditingWidget(null);
    resetForm();
    toast.success('Widget updated successfully');
  };

  const resetForm = () => {
    setNewWidget({
      projectId: project.id,
      categoryId: project.id, // Backward compatibility
      fieldId: '',
      name: '',
      type: 'number',
      position: { x: 0, y: 0 },
      size: 'medium',
      isEnabled: true,
      quickEntryEnabled: true,
      displayStyle: 'detailed',
      color: 'blue',
      icon: '📊'
    });
  };

  const startEdit = (widget: Widget) => {
    setEditingWidget(widget);
    setNewWidget(widget);
  };

  const getFieldName = (fieldId: string) => {
    const field = project.fields.find(f => f.id === fieldId);
    return field?.name || 'Unknown Field';
  };

  const getFieldType = (fieldId: string): FieldType => {
    const field = project.fields.find(f => f.id === fieldId);
    return field?.type || 'text';
  };

  const getAvailableFields = () => {
    // Filter fields that are suitable for widgets
    return project.fields.filter(field => 
      ['text', 'number', 'boolean', 'scale', 'rating', 'tally', 'choice'].includes(field.type)
    );
  };

  const getSizeLabel = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return '1x1';
      case 'medium': return '2x1';
      case 'large': return '2x2';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <span className="text-xl">{project.icon}</span>
            </div>
            Home Screen Widgets for {project.name}
          </DialogTitle>
          <DialogDescription>
            Create quick entry widgets for your home screen to track {project.name} data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{projectWidgets.length} widgets</Badge>
              <Badge variant="outline">{projectWidgets.filter(w => w.isEnabled).length} active</Badge>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              disabled={getAvailableFields().length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </Button>
          </div>

          {getAvailableFields().length === 0 && (
            <Card className="border-dashed border-muted-foreground/30">
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  No suitable fields found for widgets in this project. 
                  Add fields like Text, Number, Scale, Rating, or Tally to create widgets.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Widget Preview */}
          {projectWidgets.filter(w => w.isEnabled).length > 0 && (
            <div className="space-y-4">
              <h3>Home Screen Preview</h3>
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="relative w-full max-w-xs mx-auto aspect-[9/16] bg-black rounded-3xl p-1">
                  <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[22px] p-4 overflow-hidden">
                    <div className="text-center text-xs text-muted-foreground mb-4">
                      Home Screen
                    </div>
                    <div className="grid grid-cols-4 gap-2 relative">
                      {projectWidgets.filter(w => w.isEnabled).map((widget) => (
                        <div
                          key={widget.id}
                          className={`
                            relative rounded-xl p-2 text-center backdrop-blur-md border transition-transform hover:scale-105 active:scale-95
                            ${widget.size === 'small' ? 'col-span-1 row-span-1' : ''}
                            ${widget.size === 'medium' ? 'col-span-2 row-span-1' : ''}
                            ${widget.size === 'large' ? 'col-span-2 row-span-2' : ''}
                            ${widget.color === 'blue' ? 'bg-blue-500/20 border-blue-300' : ''}
                            ${widget.color === 'green' ? 'bg-green-500/20 border-green-300' : ''}
                            ${widget.color === 'purple' ? 'bg-purple-500/20 border-purple-300' : ''}
                            ${widget.color === 'red' ? 'bg-red-500/20 border-red-300' : ''}
                            ${widget.color === 'orange' ? 'bg-orange-500/20 border-orange-300' : ''}
                            ${widget.color === 'pink' ? 'bg-pink-500/20 border-pink-300' : ''}
                            ${widget.color === 'teal' ? 'bg-teal-500/20 border-teal-300' : ''}
                            ${widget.color === 'indigo' ? 'bg-indigo-500/20 border-indigo-300' : ''}
                            ${widget.color === 'gray' ? 'bg-gray-500/20 border-gray-300' : ''}
                          `}
                          style={{
                            gridColumnStart: Math.floor(widget.position.x / 25) + 1,
                            gridRowStart: Math.floor(widget.position.y / 25) + 1,
                          }}
                        >
                          <div className="text-lg mb-1">{widget.icon}</div>
                          {widget.displayStyle === 'detailed' && widget.size !== 'small' && (
                            <div className="text-xs truncate">{widget.name}</div>
                          )}
                          {widget.quickEntryEnabled && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Existing Widgets */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {projectWidgets.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3>No widgets yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first home screen widget for quick {project.name} tracking
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {projectWidgets.map((widget) => (
                    <motion.div
                      key={widget.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className={`relative ${widget.isEnabled ? '' : 'opacity-60'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-xl">{widget.icon}</span>
                                {widget.name}
                              </CardTitle>
                              <CardDescription>
                                {getFieldName(widget.fieldId)}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(widget)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteWidget(widget.id);
                                  toast.success('Widget deleted');
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Grip className="w-3 h-3" />
                              {getSizeLabel(widget.size)}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              <Eye className="w-3 h-3" />
                              {widget.displayStyle}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={`gap-1 ${
                                widget.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                widget.color === 'green' ? 'bg-green-100 text-green-800' :
                                widget.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                widget.color === 'red' ? 'bg-red-100 text-red-800' :
                                widget.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                widget.color === 'pink' ? 'bg-pink-100 text-pink-800' :
                                widget.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                                widget.color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {widget.color}
                            </Badge>
                            {widget.quickEntryEnabled && (
                              <Badge variant="secondary" className="gap-1">
                                <Zap className="w-3 h-3" />
                                Quick Entry
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>

        {/* Create Widget Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Widget</DialogTitle>
              <DialogDescription>
                Set up a home screen widget for {project.name}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-name">Widget Name</Label>
                  <Input
                    id="widget-name"
                    placeholder={`e.g., Quick ${project.name} Log`}
                    value={newWidget.name}
                    onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="widget-field">Field</Label>
                  <Select
                    value={newWidget.fieldId}
                    onValueChange={(value) => {
                      const fieldType = getFieldType(value);
                      setNewWidget({ 
                        ...newWidget, 
                        fieldId: value,
                        type: fieldType
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFields().map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <span>{field.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4">
                <div className="space-y-2">
                  <Label>Widget Size</Label>
                  <Select
                    value={newWidget.size}
                    onValueChange={(value: 'small' | 'medium' | 'large') => 
                      setNewWidget({ ...newWidget, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1x1)</SelectItem>
                      <SelectItem value="medium">Medium (2x1)</SelectItem>
                      <SelectItem value="large">Large (2x2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Display Style</Label>
                  <Select
                    value={newWidget.displayStyle}
                    onValueChange={(value: 'minimal' | 'detailed') => 
                      setNewWidget({ ...newWidget, displayStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-10 h-10 rounded-lg ${color.class} ${
                          newWidget.color === color.value ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setNewWidget({ ...newWidget, color: color.value })}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {ALL_ICONS.slice(0, 32).map((icon, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                          newWidget.icon === icon ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                        onClick={() => setNewWidget({ ...newWidget, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm">X Position</Label>
                      <Slider
                        value={[newWidget.position?.x || 0]}
                        onValueChange={([x]) => 
                          setNewWidget({ ...newWidget, position: { ...newWidget.position!, x } })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Y Position</Label>
                      <Slider
                        value={[newWidget.position?.y || 0]}
                        onValueChange={([y]) => 
                          setNewWidget({ ...newWidget, position: { ...newWidget.position!, y } })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Widget Enabled</Label>
                    <p className="text-sm text-muted-foreground">Show widget on home screen</p>
                  </div>
                  <Switch
                    checked={newWidget.isEnabled}
                    onCheckedChange={(checked) => setNewWidget({ ...newWidget, isEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quick Entry</Label>
                    <p className="text-sm text-muted-foreground">Allow direct data entry from widget</p>
                  </div>
                  <Switch
                    checked={newWidget.quickEntryEnabled}
                    onCheckedChange={(checked) => setNewWidget({ ...newWidget, quickEntryEnabled: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWidget}>
                Create Widget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Widget Dialog */}
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Widget</DialogTitle>
              <DialogDescription>
                Update your widget settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              {/* Same form as create but with update handler */}
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-widget-name">Widget Name</Label>
                  <Input
                    id="edit-widget-name"
                    placeholder={`e.g., Quick ${project.name} Log`}
                    value={newWidget.name}
                    onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-widget-field">Field</Label>
                  <Select
                    value={newWidget.fieldId}
                    onValueChange={(value) => {
                      const fieldType = getFieldType(value);
                      setNewWidget({ 
                        ...newWidget, 
                        fieldId: value,
                        type: fieldType
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFields().map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <span>{field.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Other tabs would be similar to create form */}
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingWidget(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateWidget}>
                Update Widget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}