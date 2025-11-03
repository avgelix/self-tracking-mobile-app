import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Category, Field, FieldType } from '../types';
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
import { ALL_ICONS, COLOR_OPTIONS } from '../utils/iconLibrary';
import { toast } from 'sonner@2.0.3';

interface CategoryEditorProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryEditor({ category, isOpen, onClose }: CategoryEditorProps) {
  const { updateCategory } = useApp();
  const [editedCategory, setEditedCategory] = useState<Category>(category);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<Field>>({
    name: '',
    type: 'text',
    isRequired: false,
    unit: '',
    options: []
  });

  useEffect(() => {
    setEditedCategory(category);
  }, [category]);

  const handleSave = () => {
    if (!editedCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (editedCategory.fields.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    updateCategory(category.id, editedCategory);
    toast.success('Category updated successfully');
    onClose();
  };

  const handleAddField = () => {
    if (!newField.name?.trim()) {
      toast.error('Field name is required');
      return;
    }

    const fieldToAdd: Field = {
      id: Date.now().toString(),
      name: newField.name,
      type: newField.type as FieldType,
      isRequired: newField.isRequired || false,
      unit: newField.unit || '',
      options: newField.options || [],
      subfields: []
    };

    setEditedCategory({
      ...editedCategory,
      fields: [...editedCategory.fields, fieldToAdd]
    });

    setNewField({
      name: '',
      type: 'text',
      isRequired: false,
      unit: '',
      options: []
    });
    setIsAddingField(false);
    toast.success('Field added');
  };

  const handleDeleteField = (fieldId: string) => {
    setEditedCategory({
      ...editedCategory,
      fields: editedCategory.fields.filter(f => f.id !== fieldId)
    });
    toast.success('Field removed');
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    setEditedCategory({
      ...editedCategory,
      fields: editedCategory.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    });
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
      case 'image': return '🖼️';
      case 'audio': return '🎵';
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
              style={{ backgroundColor: `${editedCategory.color}20` }}
            >
              <span className="text-xl">{editedCategory.icon}</span>
            </div>
            Edit Category
          </DialogTitle>
          <DialogDescription>
            Customize your category settings, icon, and data fields
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
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={editedCategory.name}
                onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
                placeholder="e.g., Water Intake, Mood Tracking"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={editedCategory.description || ''}
                onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
                placeholder="Describe what this category is for..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-unit">Default Unit (Optional)</Label>
              <Input
                id="category-unit"
                value={editedCategory.unit || ''}
                onChange={(e) => setEditedCategory({ ...editedCategory, unit: e.target.value })}
                placeholder="e.g., glasses, hours, kg, °C"
              />
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {ALL_ICONS.map((icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:scale-110 transition-transform ${
                      editedCategory.icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setEditedCategory({ ...editedCategory, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-12 rounded-xl border-2 flex items-center justify-center transition-transform hover:scale-105 ${
                      editedCategory.color === color.value ? 'border-primary scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setEditedCategory({ ...editedCategory, color: color.value })}
                    title={color.name}
                  >
                    {editedCategory.color === color.value && (
                      <span className="text-white text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Data Fields</h3>
                <p className="text-muted-foreground text-sm">
                  Configure what data you want to track for this category
                </p>
              </div>
              <Button
                onClick={() => setIsAddingField(true)}
                className="gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </div>

            {/* Existing Fields */}
            <div className="space-y-3">
              {editedCategory.fields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                          {field.name}
                          {field.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                      checked={newField.isRequired}
                      onCheckedChange={(checked) => setNewField({ ...newField, isRequired: checked })}
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