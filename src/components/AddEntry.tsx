import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Check, Plus, Settings } from 'lucide-react';
import { EntryValue, ProjectField } from '../types';
import { DynamicForm } from './DynamicForm';

interface EntriesProps {
  preselectedCategoryId?: string | null;
  onCategorySelected?: () => void;
}

export function Entries({ preselectedCategoryId, onCategorySelected }: EntriesProps) {
  const { state, addEntry, updateProject } = useApp();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProject = state.projects?.find(project => project.id === selectedCategoryId);

  // Handle preselected category from props
  useEffect(() => {
    if (preselectedCategoryId) {
      setSelectedCategoryId(preselectedCategoryId);
      setFieldValues({});
      setErrors({});
      onCategorySelected?.();
    }
  }, [preselectedCategoryId, onCategorySelected]);

  // Listen for quick track events from dashboard
  useEffect(() => {
    const handleQuickTrack = (event: any) => {
      const { categoryId } = event.detail;
      setSelectedCategoryId(categoryId);
      setFieldValues({});
      setErrors({});
    };

    window.addEventListener('quickTrack', handleQuickTrack);
    return () => window.removeEventListener('quickTrack', handleQuickTrack);
  }, []);

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedProject) return newErrors;

    const validateFieldsRecursive = (fields: any[]) => {
      fields.forEach(field => {
        const value = fieldValues[field.id];
        
        if (field.required && (value === undefined || value === null || value === '')) {
          newErrors[field.id] = `${field.name} is required`;
        }
        
        if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
        
        if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
          newErrors[field.id] = 'Please enter a valid URL';
        }
        
        if (field.type === 'number' && value !== '' && value !== undefined) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            newErrors[field.id] = 'Please enter a valid number';
          } else {
            if (field.min !== undefined && numValue < field.min) {
              newErrors[field.id] = `Value must be at least ${field.min}`;
            }
            if (field.max !== undefined && numValue > field.max) {
              newErrors[field.id] = `Value must be at most ${field.max}`;
            }
          }
        }
        
        if (field.subfields && field.subfields.length > 0) {
          validateFieldsRecursive(field.subfields);
        }
      });
    };

    validateFieldsRecursive(selectedProject.fields);
    return newErrors;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<ProjectField>) => {
    if (!selectedProject) return;

    const updateFieldInArray = (fields: ProjectField[]): ProjectField[] => {
      return fields.map(field => {
        if (field.id === fieldId) {
          return { ...field, ...updates };
        }
        if (field.subfields) {
          return { ...field, subfields: updateFieldInArray(field.subfields) };
        }
        return field;
      });
    };

    const updatedFields = updateFieldInArray(selectedProject.fields);
    updateProject(selectedProject.id, { fields: updatedFields });
  };

  const convertToEntryValues = (fields: any[], values: Record<string, any>): EntryValue[] => {
    return fields.map(field => ({
      fieldId: field.id,
      value: values[field.id],
      subvalues: field.subfields && field.subfields.length > 0 
        ? convertToEntryValues(field.subfields, values)
        : undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      toast.error('Please select a project');
      return;
    }

    // Validate fields
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    const entryValues = convertToEntryValues(selectedProject!.fields, fieldValues);

    addEntry({
      projectId: selectedCategoryId,
      categoryId: selectedCategoryId, // Backward compatibility
      values: entryValues,
      date: new Date(date),
      note: note.trim() || undefined
    });

    toast.success('Entry added successfully!');
    
    // Reset form to default state
    setSelectedCategoryId('');
    setFieldValues({});
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
  };



  return (
    <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-medium mb-2">Entries</h1>
        <p className="text-muted-foreground">Track your progress</p>
      </motion.div>

      <div>
        <Card className="p-6 bg-white/90 backdrop-blur-xl border-white/40 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label>Project</Label>
              
              {(state.projects?.length || 0) === 0 ? (
                <Card 
                  className="text-center bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors pt-[24px] pr-[14px] pb-[14px] pl-[14px]"
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
                  <p className="text-sm text-muted-foreground mb-1">No projects yet</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Tap here to go to Projects and create your first project!
                  </p>
                </Card>
              ) : (
                <Select value={selectedCategoryId} onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  setFieldValues({}); // Reset field values when project changes
                  setErrors({});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {(state.projects || []).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span>{project.icon}</span>
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({project.fields?.length || 0} field{(project.fields?.length || 0) !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Dynamic Form Fields */}
            {selectedProject && selectedProject.fields && selectedProject.fields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <DynamicForm
                  fields={selectedProject.fields}
                  values={fieldValues}
                  onChange={handleFieldChange}
                  onFieldUpdate={handleFieldUpdate}
                  errors={errors}
                  categoryName={selectedProject.name}
                  categoryIcon={selectedProject.icon}
                  categoryColor={selectedProject.color}
                />
              </motion.div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this entry..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <motion.div
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full"
                disabled={!selectedCategoryId}
              >
                <Check className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </motion.div>
          </form>
        </Card>
      </div>

      {/* Recent Entries */}
      {(state.projects?.length || 0) > 0 && !selectedCategoryId && (() => {
        // Get projects sorted by most recent entry
        const projectEntryDates = new Map<string, Date>();
        
        // Find the most recent entry date for each project
        (state.entries || []).forEach(entry => {
          const entryDate = new Date(entry.date);
          const currentDate = projectEntryDates.get(entry.projectId);
          
          if (!currentDate || entryDate > currentDate) {
            projectEntryDates.set(entry.projectId, entryDate);
          }
        });
        
        // Sort projects by most recent entry date
        const recentProjects = (state.projects || [])
          .filter(project => projectEntryDates.has(project.id))
          .sort((a, b) => {
            const dateA = projectEntryDates.get(a.id)!;
            const dateB = projectEntryDates.get(b.id)!;
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 4);
        
        // If no projects have entries yet, show first 4 projects
        const displayProjects = recentProjects.length > 0 
          ? recentProjects 
          : (state.projects || []).slice(0, 4);
        
        return (
          <div>
            <h2 className="font-medium mb-3">Recent Entries</h2>
            <div className="grid grid-cols-1 gap-3">
              {displayProjects.map((project, index) => (
                <div key={project.id}>
                  <Card 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors bg-white/85 backdrop-blur-xl border-white/40 shadow-md"
                    onClick={() => {
                      setSelectedCategoryId(project.id);
                      setFieldValues({});
                      setErrors({});
                    }}
                    style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{project.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {project.fields?.length || 0} field{(project.fields?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}