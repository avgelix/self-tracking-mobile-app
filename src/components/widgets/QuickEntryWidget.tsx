import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../contexts/AppContext';
import { Widget, Entry, EntryValue } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Plus, Minus, Check, X, Star } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface QuickEntryWidgetProps {
  widget: Widget;
  className?: string;
}

export function QuickEntryWidget({ widget, className = '' }: QuickEntryWidgetProps) {
  const { state, addEntry } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quickValue, setQuickValue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const category = state.categories.find(c => c.id === widget.categoryId);
  const field = category?.fields.find(f => f.id === widget.fieldId);

  if (!category || !field) {
    return null;
  }

  const handleQuickEntry = async (value: any) => {
    setIsLoading(true);
    
    try {
      const entryValue: EntryValue = {
        fieldId: field.id,
        value: value
      };

      const entry: Omit<Entry, 'id'> = {
        categoryId: category.id,
        values: [entryValue],
        date: new Date()
      };

      addEntry(entry);
      toast.success(`${field.name} recorded successfully!`);
      setQuickValue(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to record entry');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuickEntry = () => {
    switch (field.type) {
      case 'tally':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{quickValue || 0}</div>
              <div className="text-sm text-muted-foreground">Count</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setQuickValue(Math.max(0, (quickValue || 0) - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                className="flex-1"
                onClick={() => setQuickValue((quickValue || 0) + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleQuickEntry({ count: quickValue || 0 })}
              disabled={isLoading}
            >
              Record Count
            </Button>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{field.name}</label>
              <Input
                type="number"
                placeholder="Enter value"
                value={quickValue || ''}
                onChange={(e) => setQuickValue(parseFloat(e.target.value) || 0)}
                min={field.min}
                max={field.max}
              />
              {field.unit && (
                <div className="text-sm text-muted-foreground">{field.unit}</div>
              )}
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleQuickEntry(quickValue)}
              disabled={isLoading || quickValue === null}
            >
              Record Value
            </Button>
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium mb-4">{field.name}</div>
              <div className="flex gap-2">
                <Button
                  variant={quickValue === true ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setQuickValue(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={quickValue === false ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setQuickValue(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  No
                </Button>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleQuickEntry(quickValue)}
              disabled={isLoading || quickValue === null}
            >
              Record
            </Button>
          </div>
        );

      case 'scale':
      case 'rating':
        const max = field.max || 10;
        const min = field.min || 1;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{field.name}</label>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{quickValue || min}</div>
                <Slider
                  value={[quickValue || min]}
                  onValueChange={([value]) => setQuickValue(value)}
                  min={min}
                  max={max}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleQuickEntry(quickValue)}
              disabled={isLoading}
            >
              Record Rating
            </Button>
          </div>
        );

      case 'choice':
        if (!field.options) return null;
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{field.name}</label>
              <div className="grid gap-2">
                {field.options.map((option) => (
                  <Button
                    key={option}
                    variant={quickValue === option ? 'default' : 'outline'}
                    onClick={() => setQuickValue(option)}
                    className="justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleQuickEntry(quickValue)}
              disabled={isLoading || !quickValue}
            >
              Record Choice
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            Quick entry not supported for {field.type} fields
          </div>
        );
    }
  };

  const getWidgetSizeClasses = () => {
    switch (widget.size) {
      case 'small':
        return 'w-16 h-16';
      case 'medium':
        return 'w-32 h-16';
      case 'large':
        return 'w-32 h-32';
    }
  };

  const getColorClasses = () => {
    const baseClasses = 'backdrop-blur-md border';
    switch (widget.color) {
      case 'blue':
        return `${baseClasses} bg-blue-500/20 border-blue-300 hover:bg-blue-500/30`;
      case 'green':
        return `${baseClasses} bg-green-500/20 border-green-300 hover:bg-green-500/30`;
      case 'purple':
        return `${baseClasses} bg-purple-500/20 border-purple-300 hover:bg-purple-500/30`;
      case 'red':
        return `${baseClasses} bg-red-500/20 border-red-300 hover:bg-red-500/30`;
      case 'orange':
        return `${baseClasses} bg-orange-500/20 border-orange-300 hover:bg-orange-500/30`;
      case 'pink':
        return `${baseClasses} bg-pink-500/20 border-pink-300 hover:bg-pink-500/30`;
      case 'teal':
        return `${baseClasses} bg-teal-500/20 border-teal-300 hover:bg-teal-500/30`;
      case 'indigo':
        return `${baseClasses} bg-indigo-500/20 border-indigo-300 hover:bg-indigo-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 border-gray-300 hover:bg-gray-500/30`;
    }
  };

  const renderWidgetContent = () => {
    if (widget.displayStyle === 'minimal') {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-2xl">{widget.icon}</span>
        </div>
      );
    }

    return (
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{widget.icon}</span>
          {widget.size !== 'small' && (
            <span className="text-sm font-medium truncate flex-1">{widget.name}</span>
          )}
        </div>
        {widget.size === 'large' && (
          <div className="text-xs text-muted-foreground truncate">
            {category.name}
          </div>
        )}
        {widget.quickEntryEnabled && (
          <div className="mt-auto">
            <Badge variant="secondary" className="text-xs">
              Quick Entry
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <motion.div
        className={`${getWidgetSizeClasses()} ${getColorClasses()} ${className} rounded-xl cursor-pointer relative overflow-hidden`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => widget.quickEntryEnabled && setIsDialogOpen(true)}
      >
        {renderWidgetContent()}
        {widget.quickEntryEnabled && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
        )}
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{widget.icon}</span>
              {widget.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {renderQuickEntry()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}