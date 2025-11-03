import { useState } from 'react';
import { motion } from 'motion/react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Calendar, Star, Clock, MapPin, Mail, Phone, Link, Palette, Upload, Navigation, Hash } from 'lucide-react';
import { ProjectField, EntryValue, FieldType } from '../types';
import { PathRecorder } from './PathRecorder';
import { TallyCounter } from './TallyCounter';

interface DynamicFormProps {
  fields: ProjectField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any, subvalues?: EntryValue[]) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<ProjectField>) => void;
  errors?: Record<string, string>;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export function DynamicForm({ fields, values, onChange, onFieldUpdate, errors, categoryName, categoryIcon, categoryColor }: DynamicFormProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const renderFieldIcon = (type: FieldType) => {
    const iconClass = "w-4 h-4 text-muted-foreground";
    switch (type) {
      case 'date': return <Calendar className={iconClass} />;
      case 'time': return <Clock className={iconClass} />;
      case 'datetime': return <Clock className={iconClass} />;
      case 'rating': return <Star className={iconClass} />;
      case 'location': return <MapPin className={iconClass} />;
      case 'email': return <Mail className={iconClass} />;
      case 'phone': return <Phone className={iconClass} />;
      case 'url': return <Link className={iconClass} />;
      case 'color': return <Palette className={iconClass} />;
      case 'file': return <Upload className={iconClass} />;
      case 'path': return <Navigation className={iconClass} />;
      case 'tally': return <Hash className={iconClass} />;
      case 'spectrum': return <span className="w-4 h-4 text-muted-foreground">◄─●─►</span>;
      default: return null;
    }
  };

  const renderField = (field: ProjectField, depth: number = 0): JSX.Element => {
    const fieldValue = values[field.id];
    const hasError = errors?.[field.id];
    const hasSubfields = field.subfields && field.subfields.length > 0;

    const commonProps = {
      className: hasError ? "border-destructive" : "",
      required: field.required
    };

    let fieldInput: JSX.Element;

    switch (field.type) {
      case 'text':
        fieldInput = (
          <Input
            {...commonProps}
            type="text"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          />
        );
        break;

      case 'number':
        fieldInput = (
          <div className="space-y-2">
            <Input
              {...commonProps}
              type="number"
              value={fieldValue || ''}
              onChange={(e) => onChange(field.id, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.description || '0'}
              min={field.min}
              max={field.max}
            />
            {field.unit && (
              <div className="text-xs text-muted-foreground">Unit: {field.unit}</div>
            )}
          </div>
        );
        break;

      case 'boolean':
        fieldInput = (
          <div className="flex items-center gap-2">
            <Switch
              checked={fieldValue || false}
              onCheckedChange={(checked) => onChange(field.id, checked)}
            />
            <span className="text-sm">{fieldValue ? 'Yes' : 'No'}</span>
          </div>
        );
        break;

      case 'scale':
        const scaleMin = field.min || 1;
        const scaleMax = field.max || 10;
        fieldInput = (
          <div className="space-y-3">
            <Slider
              value={[fieldValue || scaleMin]}
              onValueChange={([value]) => onChange(field.id, value)}
              min={scaleMin}
              max={scaleMax}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{scaleMin}</span>
              <span className="font-medium text-primary">{fieldValue || scaleMin}</span>
              <span>{scaleMax}</span>
            </div>
            {field.unit && (
              <div className="text-xs text-muted-foreground text-center">
                {fieldValue || scaleMin}{field.unit}
              </div>
            )}
          </div>
        );
        break;

      case 'spectrum':
        const spectrumValue = fieldValue ?? 50;
        const allPoints = [
          { position: 0, label: field.spectrumConfig?.startLabel || 'Start' },
          ...(field.spectrumConfig?.midpoints || []).sort((a, b) => a.position - b.position),
          { position: 100, label: field.spectrumConfig?.endLabel || 'End' }
        ];
        fieldInput = (
          <div className="space-y-4">
            <Slider
              value={[spectrumValue]}
              onValueChange={([value]) => onChange(field.id, value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="relative">
              {allPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="absolute transform -translate-x-1/2 text-center"
                  style={{ left: `${point.position}%` }}
                >
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {point.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {point.position}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-8">
              <span className="font-medium text-primary">{spectrumValue}</span>
              {field.unit && <span className="text-xs text-muted-foreground ml-1">{field.unit}</span>}
            </div>
          </div>
        );
        break;

      case 'choice':
        fieldInput = (
          <Select value={fieldValue || ''} onValueChange={(value) => onChange(field.id, value)}>
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;

      case 'multi_choice':
        const selectedOptions = fieldValue || [];
        fieldInput = (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newSelection = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    onChange(field.id, newSelection);
                  }}
                />
                <Label htmlFor={`${field.id}-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
        break;

      case 'rating':
        const rating = fieldValue || 0;
        fieldInput = (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange(field.id, star)}
                className={`p-1 transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating}/5 stars
            </span>
          </div>
        );
        break;

      case 'date':
        fieldInput = (
          <Input
            {...commonProps}
            type="date"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );
        break;

      case 'time':
        fieldInput = (
          <Input
            {...commonProps}
            type="time"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );
        break;

      case 'datetime':
        fieldInput = (
          <Input
            {...commonProps}
            type="datetime-local"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );
        break;

      case 'duration':
        fieldInput = (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Hours</Label>
              <Input
                type="number"
                min="0"
                value={Math.floor((fieldValue || 0) / 60)}
                onChange={(e) => {
                  const hours = Number(e.target.value) || 0;
                  const minutes = (fieldValue || 0) % 60;
                  onChange(field.id, hours * 60 + minutes);
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Minutes</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={(fieldValue || 0) % 60}
                onChange={(e) => {
                  const minutes = Number(e.target.value) || 0;
                  const hours = Math.floor((fieldValue || 0) / 60);
                  onChange(field.id, hours * 60 + minutes);
                }}
              />
            </div>
          </div>
        );
        break;

      case 'email':
        fieldInput = (
          <Input
            {...commonProps}
            type="email"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder="example@email.com"
          />
        );
        break;

      case 'phone':
        fieldInput = (
          <Input
            {...commonProps}
            type="tel"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        );
        break;

      case 'url':
        fieldInput = (
          <Input
            {...commonProps}
            type="url"
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder="https://example.com"
          />
        );
        break;

      case 'location':
        fieldInput = (
          <Textarea
            {...commonProps}
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder="Enter address or coordinates"
            rows={2}
          />
        );
        break;

      case 'color':
        fieldInput = (
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={fieldValue || '#000000'}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-12 h-12 sm:w-16 sm:h-8 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={fieldValue || '#000000'}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        );
        break;

      case 'file':
        fieldInput = (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // In a real app, you'd upload the file and store the URL
                  onChange(field.id, file.name);
                }
              }}
              {...commonProps}
            />
            {fieldValue && (
              <Badge variant="secondary" className="text-xs">
                {fieldValue}
              </Badge>
            )}
          </div>
        );
        break;

      case 'path':
        fieldInput = (
          <PathRecorder
            value={fieldValue}
            onChange={(path) => onChange(field.id, path)}
          />
        );
        break;

      case 'tally':
        fieldInput = (
          <TallyCounter
            value={fieldValue}
            onChange={(tally) => onChange(field.id, tally)}
            fieldId={field.id}
            fieldName={field.name}
            widgetEnabled={field.widgetEnabled}
            onWidgetToggle={onFieldUpdate ? (enabled) => onFieldUpdate(field.id, { widgetEnabled: enabled }) : undefined}
          />
        );
        break;

      default:
        fieldInput = (
          <Input
            {...commonProps}
            value={fieldValue || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          />
        );
    }

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`space-y-4 ${depth > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}`}
      >
        <Card className={`p-4 ${depth > 0 ? 'bg-muted/30' : 'bg-white/60'} backdrop-blur-sm border-white/30`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {renderFieldIcon(field.type)}
              <Label className={`flex-1 ${field.required ? 'after:content-["*"] after:text-destructive after:ml-1' : ''}`}>
                {field.name}
              </Label>
              {hasSubfields && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(field.id)}
                  className="h-6 w-6 p-0"
                >
                  {expandedFields.has(field.id) ? '−' : '+'}
                </Button>
              )}
            </div>

            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}

            {fieldInput}

            {hasError && (
              <p className="text-xs text-destructive">{hasError}</p>
            )}
          </div>
        </Card>

        {/* Render subfields */}
        {hasSubfields && expandedFields.has(field.id) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <DynamicForm
              fields={field.subfields!}
              values={values}
              onChange={onChange}
              onFieldUpdate={onFieldUpdate}
              errors={errors}
              categoryName={categoryName}
              categoryIcon={categoryIcon}
              categoryColor={categoryColor}
            />
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => renderField(field))}
    </div>
  );
}
