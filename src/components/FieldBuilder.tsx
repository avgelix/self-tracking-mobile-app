import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Check, ChevronsUpDown } from 'lucide-react';
import { CategoryField, FieldType } from '../types';
import { DataCollectionModeExample } from './DataCollectionModeExample';

interface FieldBuilderProps {
  fields: CategoryField[];
  onChange: (fields: CategoryField[]) => void;
  depth?: number;
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'number', label: 'Number', description: 'Numeric input (e.g., 5, 10.5)' },
  { value: 'text', label: 'Text', description: 'Short text input' },
  { value: 'boolean', label: 'Yes/No', description: 'True/false toggle' },
  { value: 'scale', label: 'Scale', description: 'Rating scale (1-10)' },
  { value: 'spectrum', label: 'Spectrum', description: 'Custom labeled scale with endpoints' },
  { value: 'choice', label: 'Single Choice', description: 'Pick one option' },
  { value: 'multi_choice', label: 'Multiple Choice', description: 'Pick multiple options' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'time', label: 'Time', description: 'Time picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'duration', label: 'Duration', description: 'Time duration (minutes/hours)' },
  { value: 'rating', label: 'Star Rating', description: '5-star rating system' },
  { value: 'email', label: 'Email', description: 'Email address input' },
  { value: 'url', label: 'URL', description: 'Website URL input' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'location', label: 'Location', description: 'Address or coordinates' },
  { value: 'color', label: 'Color', description: 'Color picker' },
  { value: 'file', label: 'File', description: 'File upload' },
  { value: 'path', label: 'Path Recording', description: 'GPS route tracking like fitness tracker' },
  { value: 'tally', label: 'Tally Counter', description: 'Increment counter with widget support' }
];

export function FieldBuilder({ fields, onChange, depth = 0 }: FieldBuilderProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [showExamples, setShowExamples] = useState<Set<string>>(new Set());
  const [openTypeDropdown, setOpenTypeDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenTypeDropdown(null);
        setSearchQuery('');
      }
    };

    if (openTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openTypeDropdown]);

  const addField = () => {
    const newField: CategoryField = {
      id: generateId(),
      name: '',
      type: 'text',
      required: false,
      subfields: []
    };
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<CategoryField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    // Show example when field type changes and automatically hide after 10 seconds
    if (updates.type && updates.type !== newFields[index].type) {
      const fieldId = newFields[index].id;
      setShowExamples(prev => new Set(prev).add(fieldId));
      setTimeout(() => {
        setShowExamples(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldId);
          return newSet;
        });
      }, 10000);
    }
    
    onChange(newFields);
  };

  const toggleExample = (fieldId: string) => {
    setShowExamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    onChange(newFields);
  };

  const toggleExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const addSubfield = (fieldIndex: number) => {
    const newSubfield: CategoryField = {
      id: generateId(),
      name: '',
      type: 'text',
      required: false,
      subfields: []
    };
    
    const newFields = [...fields];
    if (!newFields[fieldIndex].subfields) {
      newFields[fieldIndex].subfields = [];
    }
    newFields[fieldIndex].subfields!.push(newSubfield);
    onChange(newFields);
    
    // Auto-expand the field when adding subfields
    setExpandedFields(prev => new Set(prev).add(fields[fieldIndex].id));
  };

  const updateSubfields = (fieldIndex: number, subfields: CategoryField[]) => {
    const newFields = [...fields];
    newFields[fieldIndex].subfields = subfields;
    onChange(newFields);
  };

  const canHaveSubfields = (type: FieldType) => {
    return !['boolean', 'choice', 'multi_choice', 'rating', 'color', 'file', 'path', 'tally'].includes(type);
  };

  const needsOptions = (type: FieldType) => {
    return ['choice', 'multi_choice'].includes(type);
  };

  const needsMinMax = (type: FieldType) => {
    return ['number', 'scale', 'rating'].includes(type);
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
      <AnimatePresence>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <Card className={`p-4 bg-white/60 backdrop-blur-sm border-white/30 ${depth > 0 ? 'bg-white/40' : ''}`}>
              {/* Field Header */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-grab"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                
                {field.subfields && field.subfields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(field.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedFields.has(field.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                  />
                  
                  <div className="space-y-2 relative" ref={openTypeDropdown === field.id ? dropdownRef : null}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpenTypeDropdown(openTypeDropdown === field.id ? null : field.id);
                        if (openTypeDropdown !== field.id) setSearchQuery('');
                      }}
                      className="w-full justify-between"
                    >
                      {field.type
                        ? FIELD_TYPES.find((type) => type.value === field.type)?.label
                        : "Select type..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    
                    {openTypeDropdown === field.id && (
                      <div className="absolute z-50 w-[240px] mt-1 bg-white dark:bg-gray-800 rounded-md border shadow-lg">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search field types..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div 
                          className="p-1 bg-white dark:bg-gray-800 rounded-b-md"
                          style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            overflowX: 'hidden'
                          }}
                        >
                          {FIELD_TYPES.filter(type => 
                            searchQuery === '' || 
                            type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            type.description.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                updateField(index, { type: type.value });
                                setOpenTypeDropdown(null);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer text-left"
                            >
                              <Check
                                className={`mt-0.5 h-4 w-4 shrink-0 ${
                                  field.type === type.value ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </button>
                          ))}
                          {FIELD_TYPES.filter(type => 
                            searchQuery === '' || 
                            type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            type.description.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No field type found.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Example toggle button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExample(field.id)}
                      className="text-xs h-6 px-2"
                    >
                      {showExamples.has(field.id) ? 'Hide Example' : 'Show Example'}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Field Configuration */}
              <div className="space-y-3">
                {/* Required toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.required || false}
                    onCheckedChange={(checked) => updateField(index, { required: checked })}
                  />
                  <Label className="text-sm">Make field required</Label>
                </div>

                {/* Unit field for applicable types */}
                {['number', 'duration', 'scale'].includes(field.type) && (
                  <div>
                    <Label className="text-sm">Unit</Label>
                    <Input
                      placeholder="e.g., glasses, minutes, /10"
                      value={field.unit || ''}
                      onChange={(e) => updateField(index, { unit: e.target.value })}
                    />
                  </div>
                )}

                {/* Widget configuration for all supported field types */}
                {['tally', 'number', 'boolean', 'scale', 'spectrum', 'rating', 'choice'].includes(field.type) && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.widgetEnabled || false}
                      onCheckedChange={(checked) => updateField(index, { widgetEnabled: checked })}
                    />
                    <Label className="text-sm">Enable home screen widget for quick data entry</Label>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm">Description (optional)</Label>
                  <Textarea
                    placeholder="Help text for this field"
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Min/Max for numeric fields */}
                {needsMinMax(field.type) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Minimum</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.min || ''}
                        onChange={(e) => updateField(index, { min: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Maximum</Label>
                      <Input
                        type="number"
                        placeholder={field.type === 'scale' ? '10' : '100'}
                        value={field.max || ''}
                        onChange={(e) => updateField(index, { max: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                )}

                {/* Options for choice fields */}
                {needsOptions(field.type) && (
                  <div>
                    <Label className="text-sm">Options</Label>
                    <div className="space-y-2">
                      {(field.options || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(field.options || [])];
                              newOptions[optionIndex] = e.target.value;
                              updateField(index, { options: newOptions });
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
                              updateField(index, { options: newOptions });
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
                          updateField(index, { options: newOptions });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Spectrum configuration */}
                {field.type === 'spectrum' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Spectrum Unit (optional)</Label>
                      <Input
                        placeholder="e.g., intensity, satisfaction"
                        value={field.unit || ''}
                        onChange={(e) => updateField(index, { unit: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Start Label</Label>
                        <Input
                          placeholder="e.g., Not at all"
                          value={field.spectrumConfig?.startLabel || ''}
                          onChange={(e) => updateField(index, { 
                            spectrumConfig: { 
                              ...field.spectrumConfig,
                              startLabel: e.target.value,
                              endLabel: field.spectrumConfig?.endLabel || '',
                              midpoints: field.spectrumConfig?.midpoints || []
                            } 
                          })}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">End Label</Label>
                        <Input
                          placeholder="e.g., Extremely"
                          value={field.spectrumConfig?.endLabel || ''}
                          onChange={(e) => updateField(index, { 
                            spectrumConfig: { 
                              ...field.spectrumConfig,
                              startLabel: field.spectrumConfig?.startLabel || '',
                              endLabel: e.target.value,
                              midpoints: field.spectrumConfig?.midpoints || []
                            } 
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Midpoints (optional)</Label>
                      {(field.spectrumConfig?.midpoints || []).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Position indicates where the midpoint appears on the spectrum. 0 is the start, 100 is the end, and 50 is the middle.
                        </p>
                      )}
                      <div className="space-y-2">
                        {(field.spectrumConfig?.midpoints || []).map((midpoint, midpointIndex) => (
                          <div key={midpointIndex} className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              placeholder="Position (1-99)"
                              value={midpoint.position}
                              onChange={(e) => {
                                const newMidpoints = [...(field.spectrumConfig?.midpoints || [])];
                                newMidpoints[midpointIndex] = {
                                  ...newMidpoints[midpointIndex],
                                  position: Number(e.target.value)
                                };
                                updateField(index, { 
                                  spectrumConfig: { 
                                    ...field.spectrumConfig!,
                                    midpoints: newMidpoints
                                  } 
                                });
                              }}
                              className="w-32"
                            />
                            <Input
                              placeholder="Label"
                              value={midpoint.label}
                              onChange={(e) => {
                                const newMidpoints = [...(field.spectrumConfig?.midpoints || [])];
                                newMidpoints[midpointIndex] = {
                                  ...newMidpoints[midpointIndex],
                                  label: e.target.value
                                };
                                updateField(index, { 
                                  spectrumConfig: { 
                                    ...field.spectrumConfig!,
                                    midpoints: newMidpoints
                                  } 
                                });
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newMidpoints = (field.spectrumConfig?.midpoints || []).filter((_, i) => i !== midpointIndex);
                                updateField(index, { 
                                  spectrumConfig: { 
                                    ...field.spectrumConfig!,
                                    midpoints: newMidpoints
                                  } 
                                });
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
                            const newMidpoints = [...(field.spectrumConfig?.midpoints || []), { position: 50, label: '' }];
                            updateField(index, { 
                              spectrumConfig: { 
                                startLabel: field.spectrumConfig?.startLabel || '',
                                endLabel: field.spectrumConfig?.endLabel || '',
                                midpoints: newMidpoints
                              } 
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Midpoint
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subfield actions */}
                {canHaveSubfields(field.type) && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSubfield(index)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subfield
                    </Button>
                    {field.subfields && field.subfields.length > 0 && (
                      <Badge variant="secondary">
                        {field.subfields.length} subfield{field.subfields.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Data Collection Mode Example */}
            {showExamples.has(field.id) && (
              <DataCollectionModeExample
                fieldType={field.type}
                onClose={() => toggleExample(field.id)}
              />
            )}

            {/* Subfields */}
            {field.subfields && field.subfields.length > 0 && expandedFields.has(field.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <FieldBuilder
                  fields={field.subfields}
                  onChange={(subfields) => updateSubfields(index, subfields)}
                  depth={depth + 1}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Field Button */}
      <Button
        type="button"
        variant="dashed"
        onClick={addField}
        className="w-full border-2 border-dashed border-muted hover:border-primary"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add {depth > 0 ? 'Sub' : ''}Field
      </Button>
    </div>
  );
}