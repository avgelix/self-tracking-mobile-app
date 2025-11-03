import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Plus, Settings2 } from 'lucide-react';
import { ALL_ICONS, ALL_COLORS } from '../utils/iconLibrary';
import { ProjectField } from '../types';

interface FloatingActionButtonProps {
  activeTab: string;
}

export function FloatingActionButton({ activeTab }: FloatingActionButtonProps) {
  const { addProject } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isQuickDialogOpen, setIsQuickDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: ALL_ICONS[0],
    color: ALL_COLORS[0],
    fields: [] as ProjectField[]
  });

  // Only show on certain tabs
  if (activeTab === 'settings' || activeTab === 'projects') return null;

  const createQuickProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    // Create a simple single field project
    const quickField: ProjectField = {
      id: `field_${Date.now()}`,
      name: 'Value',
      type: 'number',
      unit: 'units',
      required: true,
      subfields: []
    };

    const projectData = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      fields: [quickField]
    };

    addProject(projectData);
    toast.success('Quick project created! You can customize it in Settings.');
    setIsQuickDialogOpen(false);
    setIsOpen(false);
    
    // Reset form
    setFormData({
      name: '',
      icon: ALL_ICONS[0],
      color: ALL_COLORS[0],
      fields: []
    });
  };

  return (
    <>


      <Dialog open={isQuickDialogOpen} onOpenChange={setIsQuickDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border-white/30 max-w-md w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-full fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-0 my-0 p-6">
          <DialogHeader>
            <DialogTitle>Quick Project</DialogTitle>
            <DialogDescription>
              Create a simple number-based project to start tracking immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createQuickProject} className="space-y-4 px-1">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Water Intake, Steps"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 max-h-24 overflow-y-auto p-2 bg-white/30 rounded-lg backdrop-blur-sm border">
                {ALL_ICONS.slice(0, 24).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`aspect-square p-2 text-sm rounded border transition-all hover:scale-105 ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:bg-accent hover:border-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Color</Label>
              <div className="grid grid-cols-6 gap-3 p-2 bg-white/30 rounded-lg backdrop-blur-sm border">
                {ALL_COLORS.slice(0, 12).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? 'border-primary scale-110 shadow-sm'
                        : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              For custom fields and advanced options, use the Settings page.
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}