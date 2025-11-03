import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Project, ProjectField, FieldType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { ICON_CATEGORIES, COLOR_PALETTE, ALL_ICONS, ALL_COLORS } from '../utils/iconLibrary';
import { toast } from 'sonner@2.0.3';

interface ProjectEditorProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectEditor({ project, isOpen, onClose }: ProjectEditorProps) {
  const { updateProject } = useApp();
  const [editedProject, setEditedProject] = useState<Project>(project);
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('health');
  const [selectedColorCategory, setSelectedColorCategory] = useState<string>('blues');
  const [newField, setNewField] = useState<Partial<ProjectField>>({
    name: '',
    type: 'text',
    required: false,
    unit: '',
    options: []
  });

  useEffect(() => {
    setEditedProject(project);
  }, [project]);

  const handleSave = () => {
    if (!editedProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (editedProject.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    updateProject(project.id, editedProject);
    toast.success('Project updated successfully');
    onClose();
  };

  const handleAddField = () => {
    if (!newField.name?.trim()) {
      toast.error('Field name is required');
      return;
    }

    const fieldToAdd: ProjectField = {
      id: Date.now().toString(),
      name: newField.name,
      type: newField.type as FieldType,
      required: newField.required || false,
      unit: newField.unit || '',
      options: newField.options || [],
      subfields: []
    };

    setEditedProject({
      ...editedProject,
      fields: [...editedProject.fields, fieldToAdd]
    });

    setNewField({
      name: '',
      type: 'text',
      required: false,
      unit: '',
      options: []
    });
    setIsAddingField(false);
    toast.success('Field added');
  };

  const handleDeleteField = (fieldId: string) => {
    setEditedProject({
      ...editedProject,
      fields: editedProject.fields.filter(f => f.id !== fieldId)
    });
    toast.success('Field removed');
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<ProjectField>) => {
    setEditedProject({
      ...editedProject,
      fields: editedProject.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    });
  };

  const handleStartEditField = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setIsAddingField(false); // Close add field form if open
  };

  const handleSaveEditField = (fieldId: string) => {
    const field = editedProject.fields.find(f => f.id === fieldId);
    if (!field || !field.name.trim()) {
      toast.error('Field name is required');
      return;
    }
    setEditingFieldId(null);
    toast.success('Field updated');
  };

  const handleCancelEditField = () => {
    setEditingFieldId(null);
  };

  // Helper function to check if a field type can have subfields
  const canHaveSubfields = (type: FieldType) => {
    return !['boolean', 'choice', 'multi_choice', 'rating', 'color', 'file', 'path', 'tally'].includes(type);
  };

  // Add a subfield to a field
  const handleAddSubfield = (fieldId: string) => {
    const newSubfield: ProjectField = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'text',
      required: false,
      subfields: []
    };

    setEditedProject({
      ...editedProject,
      fields: editedProject.fields.map(f => {
        if (f.id === fieldId) {
          return {
            ...f,
            subfields: [...(f.subfields || []), newSubfield]
          };
        }
        return f;
      })
    });
  };

  // Update a subfield within a field
  const handleUpdateSubfield = (fieldId: string, subfieldId: string, updates: Partial<ProjectField>) => {
    setEditedProject({
      ...editedProject,
      fields: editedProject.fields.map(f => {
        if (f.id === fieldId && f.subfields) {
          return {
            ...f,
            subfields: f.subfields.map(sf => 
              sf.id === subfieldId ? { ...sf, ...updates } : sf
            )
          };
        }
        return f;
      })
    });
  };

  // Delete a subfield from a field
  const handleDeleteSubfield = (fieldId: string, subfieldId: string) => {
    setEditedProject({
      ...editedProject,
      fields: editedProject.fields.map(f => {
        if (f.id === fieldId && f.subfields) {
          return {
            ...f,
            subfields: f.subfields.filter(sf => sf.id !== subfieldId)
          };
        }
        return f;
      })
    });
    toast.success('Subfield removed');
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'date': return '📅';
      case 'time': return '🕐';
      case 'datetime': return '📅🕐';
      case 'duration': return '⏱️';
      case 'choice': return '📋';
      case 'multi_choice': return '☑️';
      case 'scale': return '📊';
      case 'rating': return '⭐';
      case 'location': return '📍';
      case 'file': return '🖼️';
      case 'tally': return '🔢';
      case 'path': return '🗺️';
      default: return '📝';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${editedProject.color}20` }}
            >
              <span className="text-xl">{editedProject.icon}</span>
            </div>
            Edit Project
          </DialogTitle>
          <DialogDescription>
            Customize your project settings, icon, and data fields
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={editedProject.name}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                placeholder="e.g., Water Intake, Mood Tracking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                value={editedProject.description || ''}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                placeholder="Describe what this project is for..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
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
                            onClick={() => setEditedProject({ ...editedProject, icon })}
                            className={`aspect-square p-2 text-lg rounded border transition-all hover:scale-105 ${
                              editedProject.icon === icon
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
                            onClick={() => setEditedProject({ ...editedProject, color })}
                            className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 transition-transform ${
                              editedProject.color === color
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

          <TabsContent value="fields" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Data Fields</h3>
                <p className="text-muted-foreground text-sm">
                  Configure what data you want to track for this project
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsAddingField(true);
                  setEditingFieldId(null); // Close any open edit forms
                }}
                className="gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </div>

            {/* Existing Fields */}
            <div className="space-y-3">
              {editedProject.fields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    {editingFieldId === field.id ? (
                      /* Edit Mode */
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center gap-2">
                            <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                            Edit Field
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditField}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-field-name-${field.id}`}>Field Name</Label>
                              <Input
                                id={`edit-field-name-${field.id}`}
                                value={field.name}
                                onChange={(e) => handleFieldUpdate(field.id, { name: e.target.value })}
                                placeholder="e.g., Amount, Rating, Notes"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`edit-field-type-${field.id}`}>Field Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: FieldType) => handleFieldUpdate(field.id, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Yes/No</SelectItem>
                                  <SelectItem value="choice">Single Choice</SelectItem>
                                  <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="scale">Scale (1-10)</SelectItem>
                                  <SelectItem value="rating">Rating (Stars)</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="time">Time</SelectItem>
                                  <SelectItem value="datetime">Date & Time</SelectItem>
                                  <SelectItem value="duration">Duration</SelectItem>
                                  <SelectItem value="location">Location</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="url">URL</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="color">Color</SelectItem>
                                  <SelectItem value="file">File</SelectItem>
                                  <SelectItem value="tally">Tally Counter</SelectItem>
                                  <SelectItem value="path">Path Recording</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Description field */}
                          <div className="space-y-2">
                            <Label htmlFor={`edit-field-description-${field.id}`}>Description (Optional)</Label>
                            <Textarea
                              id={`edit-field-description-${field.id}`}
                              value={field.description || ''}
                              onChange={(e) => handleFieldUpdate(field.id, { description: e.target.value })}
                              placeholder="Help text for this field"
                              rows={2}
                            />
                          </div>

                          {/* Unit field for applicable types */}
                          {['number', 'duration', 'scale'].includes(field.type) && (
                            <div className="space-y-2">
                              <Label htmlFor={`edit-field-unit-${field.id}`}>Unit (Optional)</Label>
                              <Input
                                id={`edit-field-unit-${field.id}`}
                                value={field.unit || ''}
                                onChange={(e) => handleFieldUpdate(field.id, { unit: e.target.value })}
                                placeholder="e.g., glasses, minutes, /10"
                              />
                            </div>
                          )}

                          {/* Min/Max for numeric fields */}
                          {['number', 'scale', 'rating'].includes(field.type) && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-field-min-${field.id}`}>Minimum</Label>
                                <Input
                                  id={`edit-field-min-${field.id}`}
                                  type="number"
                                  placeholder="0"
                                  value={field.min || ''}
                                  onChange={(e) => handleFieldUpdate(field.id, { min: e.target.value ? Number(e.target.value) : undefined })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-field-max-${field.id}`}>Maximum</Label>
                                <Input
                                  id={`edit-field-max-${field.id}`}
                                  type="number"
                                  placeholder={field.type === 'scale' ? '10' : '100'}
                                  value={field.max || ''}
                                  onChange={(e) => handleFieldUpdate(field.id, { max: e.target.value ? Number(e.target.value) : undefined })}
                                />
                              </div>
                            </div>
                          )}

                          {/* Options for choice fields */}
                          {['choice', 'multi_choice'].includes(field.type) && (
                            <div className="space-y-2">
                              <Label>Options</Label>
                              <div className="space-y-2">
                                {(field.options || []).map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(field.options || [])];
                                        newOptions[optionIndex] = e.target.value;
                                        handleFieldUpdate(field.id, { options: newOptions });
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
                                        handleFieldUpdate(field.id, { options: newOptions });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = [...(field.options || []), ''];
                                    handleFieldUpdate(field.id, { options: newOptions });
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Widget configuration */}
                          {['tally', 'number', 'boolean', 'scale', 'rating', 'choice'].includes(field.type) && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`edit-field-widget-${field.id}`}
                                checked={field.widgetEnabled || false}
                                onCheckedChange={(checked) => handleFieldUpdate(field.id, { widgetEnabled: checked })}
                              />
                              <Label htmlFor={`edit-field-widget-${field.id}`}>Enable home screen widget for quick data entry</Label>
                            </div>
                          )}

                          {/* Required field toggle */}
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`edit-field-required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: checked })}
                            />
                            <Label htmlFor={`edit-field-required-${field.id}`}>Required field</Label>
                          </div>

                          {/* Subfields section */}
                          {canHaveSubfields(field.type) && (
                            <div className="space-y-3 pt-4 border-t border-muted">
                              <div className="flex items-center justify-between">
                                <Label>Subfields</Label>
                                {field.subfields && field.subfields.length > 0 && (
                                  <Badge variant="secondary">
                                    {field.subfields.length} subfield{field.subfields.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>

                              {/* Display existing subfields */}
                              {field.subfields && field.subfields.length > 0 && (
                                <div className="space-y-3 ml-4 pl-4 border-l-2 border-muted">
                                  {field.subfields.map((subfield) => (
                                    <Card key={subfield.id} className="p-3 bg-white/40 backdrop-blur-sm border-white/30">
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-2">
                                            <Label className="text-sm">Subfield Name</Label>
                                            <Input
                                              value={subfield.name}
                                              onChange={(e) => handleUpdateSubfield(field.id, subfield.id, { name: e.target.value })}
                                              placeholder="Subfield name"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-sm">Type</Label>
                                            <Select
                                              value={subfield.type}
                                              onValueChange={(value: FieldType) => handleUpdateSubfield(field.id, subfield.id, { type: value })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="boolean">Yes/No</SelectItem>
                                                <SelectItem value="choice">Single Choice</SelectItem>
                                                <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                                                <SelectItem value="scale">Scale</SelectItem>
                                                <SelectItem value="rating">Rating</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="time">Time</SelectItem>
                                                <SelectItem value="datetime">Date & Time</SelectItem>
                                                <SelectItem value="duration">Duration</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Unit for applicable subfield types */}
                                        {['number', 'duration', 'scale'].includes(subfield.type) && (
                                          <div className="space-y-2">
                                            <Label className="text-sm">Unit (Optional)</Label>
                                            <Input
                                              value={subfield.unit || ''}
                                              onChange={(e) => handleUpdateSubfield(field.id, subfield.id, { unit: e.target.value })}
                                              placeholder="e.g., glasses, minutes, /10"
                                            />
                                          </div>
                                        )}

                                        {/* Options for choice subfields */}
                                        {['choice', 'multi_choice'].includes(subfield.type) && (
                                          <div className="space-y-2">
                                            <Label className="text-sm">Options</Label>
                                            <div className="space-y-2">
                                              {(subfield.options || []).map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex gap-2">
                                                  <Input
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                    value={option}
                                                    onChange={(e) => {
                                                      const newOptions = [...(subfield.options || [])];
                                                      newOptions[optionIndex] = e.target.value;
                                                      handleUpdateSubfield(field.id, subfield.id, { options: newOptions });
                                                    }}
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      const newOptions = (subfield.options || []).filter((_, i) => i !== optionIndex);
                                                      handleUpdateSubfield(field.id, subfield.id, { options: newOptions });
                                                    }}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              ))}
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  const newOptions = [...(subfield.options || []), ''];
                                                  handleUpdateSubfield(field.id, subfield.id, { options: newOptions });
                                                }}
                                              >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add Option
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              checked={subfield.required || false}
                                              onCheckedChange={(checked) => handleUpdateSubfield(field.id, subfield.id, { required: checked })}
                                            />
                                            <Label className="text-sm">Required</Label>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteSubfield(field.id, subfield.id)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSubfield(field.id)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Subfield
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelEditField}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => handleSaveEditField(field.id)}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                              {field.name}
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditField(field.id)}
                                title="Edit field"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                                title="Delete field"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{field.type}</Badge>
                            {field.unit && <Badge variant="outline">{field.unit}</Badge>}
                            {field.options && field.options.length > 0 && (
                              <Badge variant="outline">{field.options.length} options</Badge>
                            )}
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Add Field Form */}
            {isAddingField && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-dashed border-primary rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4>Add New Field</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingField(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Field Name</Label>
                    <Input
                      id="field-name"
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      placeholder="e.g., Amount, Rating, Notes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      value={newField.type}
                      onValueChange={(value: FieldType) => setNewField({ ...newField, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                        <SelectItem value="choice">Single Choice</SelectItem>
                        <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                        <SelectItem value="scale">Scale (1-10)</SelectItem>
                        <SelectItem value="rating">Rating (Stars)</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="datetime">Date & Time</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="tally">Tally Counter</SelectItem>
                        <SelectItem value="path">Path Recording</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newField.type === 'number' || newField.type === 'scale' || newField.type === 'rating' || newField.type === 'duration') && (
                    <div className="space-y-2">
                      <Label htmlFor="field-unit">Unit (Optional)</Label>
                      <Input
                        id="field-unit"
                        value={newField.unit}
                        onChange={(e) => setNewField({ ...newField, unit: e.target.value })}
                        placeholder="e.g., glasses, kg, hours"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="field-required"
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                    />
                    <Label htmlFor="field-required">Required field</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingField(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddField}>
                    Add Field
                  </Button>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}