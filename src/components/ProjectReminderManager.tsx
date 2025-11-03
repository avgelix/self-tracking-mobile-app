import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Project, Reminder, ReminderFrequency, NotificationType, NotificationSound, NotificationPrivacy, CustomFrequency } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Bell, Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { format } from '../utils/dateHelpers';
import { toast } from 'sonner@2.0.3';

interface ProjectReminderManagerProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectReminderManager({ project, isOpen, onClose }: ProjectReminderManagerProps) {
  const { state, addReminder, updateReminder, deleteReminder } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    projectId: project.id,
    categoryId: project.id, // Backward compatibility
    fieldId: '',
    name: '',
    message: '',
    frequency: 'daily',
    startDate: new Date(),
    isActive: true,
    notificationType: 'simple',
    notificationSound: 'default',
    soundEnabled: true,
    privacy: 'public',
    showOnHomeScreen: true
  });

  const [customFreq, setCustomFreq] = useState<CustomFrequency>({
    interval: 1,
    unit: 'days',
    timeOfDay: '09:00'
  });

  // Filter reminders for this project only
  const projectReminders = state.reminders.filter(r => (r.projectId || r.categoryId) === project.id);

  const handleCreateReminder = () => {
    if (!newReminder.name) {
      toast.error('Reminder name is required');
      return;
    }

    const reminderToAdd = {
      ...newReminder,
      projectId: project.id,
      categoryId: project.id, // Backward compatibility
      customFrequency: newReminder.frequency === 'custom' ? customFreq : undefined
    } as Omit<Reminder, 'id' | 'createdAt' | 'nextDue'>;

    addReminder(reminderToAdd);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success('Reminder created successfully');
  };

  const handleUpdateReminder = () => {
    if (!editingReminder) return;

    const updates = {
      ...newReminder,
      customFrequency: newReminder.frequency === 'custom' ? customFreq : undefined
    };

    updateReminder(editingReminder.id, updates);
    setEditingReminder(null);
    resetForm();
    toast.success('Reminder updated successfully');
  };

  const resetForm = () => {
    setNewReminder({
      projectId: project.id,
      categoryId: project.id, // Backward compatibility
      fieldId: '',
      name: '',
      message: '',
      frequency: 'daily',
      startDate: new Date(),
      isActive: true,
      notificationType: 'simple',
      notificationSound: 'default',
      soundEnabled: true,
      privacy: 'public',
      showOnHomeScreen: true
    });
    setCustomFreq({
      interval: 1,
      unit: 'days',
      timeOfDay: '09:00'
    });
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      projectId: reminder.projectId,
      categoryId: reminder.categoryId,
      fieldId: reminder.fieldId,
      name: reminder.name,
      message: reminder.message,
      frequency: reminder.frequency,
      startDate: reminder.startDate,
      endDate: reminder.endDate,
      isActive: reminder.isActive,
      notificationType: reminder.notificationType,
      notificationSound: reminder.notificationSound,
      soundEnabled: reminder.soundEnabled,
      privacy: reminder.privacy,
      showOnHomeScreen: reminder.showOnHomeScreen
    });
    if (reminder.customFrequency) {
      setCustomFreq(reminder.customFrequency);
    }
  };

  const getFieldName = (fieldId?: string) => {
    if (!fieldId) return '';
    const field = project.fields.find(f => f.id === fieldId);
    return field?.name || '';
  };

  const formatFrequency = (reminder: Reminder) => {
    switch (reminder.frequency) {
      case 'once':
        return 'Once';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        if (reminder.customFrequency) {
          const { interval, unit } = reminder.customFrequency;
          return `Every ${interval} ${unit}`;
        }
        return 'Custom';
      default:
        return reminder.frequency;
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
            Manage Reminders for {project.name}
          </DialogTitle>
          <DialogDescription>
            Set up notifications to help you track data consistently for this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{projectReminders.length} reminders</Badge>
              <Badge variant="outline">{projectReminders.filter(r => r.isActive).length} active</Badge>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Reminder
            </Button>
          </div>

          {/* Existing Reminders */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {projectReminders.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3>No reminders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first reminder to stay on track with tracking {project.name}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {projectReminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className={`relative ${reminder.isActive ? '' : 'opacity-60'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{reminder.name}</CardTitle>
                              <CardDescription>
                                {reminder.fieldId ? getFieldName(reminder.fieldId) : 'General reminder'}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(reminder)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  deleteReminder(reminder.id);
                                  toast.success('Reminder deleted');
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {reminder.message && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{reminder.message}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {formatFrequency(reminder)}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              Next: {format(reminder.nextDue, 'MMM d, h:mm a')}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              {reminder.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                              {reminder.notificationSound}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              {reminder.showOnHomeScreen ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {reminder.privacy}
                            </Badge>
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

        {/* Create Reminder Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder for {project.name}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="notification">Notification</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-name">Reminder Name</Label>
                  <Input
                    id="reminder-name"
                    placeholder={`e.g., Daily ${project.name} Check`}
                    value={newReminder.name}
                    onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field">Specific Field (Optional)</Label>
                  <Select
                    value={newReminder.fieldId || '__general__'}
                    onValueChange={(value) => setNewReminder({ ...newReminder, fieldId: value === '__general__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field or leave empty for general reminder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general__">General reminder for {project.name}</SelectItem>
                      {project.fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-type">Notification Type</Label>
                  <Select
                    value={newReminder.notificationType}
                    onValueChange={(value: NotificationType) => setNewReminder({ ...newReminder, notificationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple reminder</SelectItem>
                      <SelectItem value="custom">Custom message/question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReminder.notificationType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-message">Custom Message/Question</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="e.g., How is your mood today?"
                      value={newReminder.message}
                      onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newReminder.frequency}
                    onValueChange={(value: ReminderFrequency) => setNewReminder({ ...newReminder, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReminder.frequency === 'custom' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4>Custom Frequency</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Every</Label>
                        <Input
                          type="number"
                          min="1"
                          value={customFreq.interval}
                          onChange={(e) => setCustomFreq({ ...customFreq, interval: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={customFreq.unit}
                          onValueChange={(value: 'minutes' | 'hours' | 'days' | 'weeks' | 'months') => 
                            setCustomFreq({ ...customFreq, unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Time of Day</Label>
                      <Input
                        type="time"
                        value={customFreq.timeOfDay}
                        onChange={(e) => setCustomFreq({ ...customFreq, timeOfDay: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newReminder.startDate ? format(newReminder.startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newReminder.startDate}
                        onSelect={(date) => date && setNewReminder({ ...newReminder, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </TabsContent>

              <TabsContent value="notification" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Enabled</Label>
                    <p className="text-sm text-muted-foreground">Play notification sound</p>
                  </div>
                  <Switch
                    checked={newReminder.soundEnabled}
                    onCheckedChange={(checked) => setNewReminder({ ...newReminder, soundEnabled: checked })}
                  />
                </div>

                {newReminder.soundEnabled && (
                  <div className="space-y-2">
                    <Label>Notification Sound</Label>
                    <Select
                      value={newReminder.notificationSound}
                      onValueChange={(value: NotificationSound) => setNewReminder({ ...newReminder, notificationSound: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="gentle">Gentle</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="chime">Chime</SelectItem>
                        <SelectItem value="silent">Silent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Privacy Level</Label>
                  <Select
                    value={newReminder.privacy}
                    onValueChange={(value: NotificationPrivacy) => setNewReminder({ ...newReminder, privacy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (show full content)</SelectItem>
                      <SelectItem value="private">Private (hide details)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show on Home Screen</Label>
                    <p className="text-sm text-muted-foreground">Display notification on lock screen</p>
                  </div>
                  <Switch
                    checked={newReminder.showOnHomeScreen}
                    onCheckedChange={(checked) => setNewReminder({ ...newReminder, showOnHomeScreen: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Enable this reminder</p>
                  </div>
                  <Switch
                    checked={newReminder.isActive}
                    onCheckedChange={(checked) => setNewReminder({ ...newReminder, isActive: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReminder}>
                Create Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Reminder Dialog */}
        <Dialog open={!!editingReminder} onOpenChange={() => setEditingReminder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Reminder</DialogTitle>
              <DialogDescription>
                Update your reminder settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              {/* Same form as create but with update handler */}
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="notification">Notification</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-reminder-name">Reminder Name</Label>
                  <Input
                    id="edit-reminder-name"
                    placeholder={`e.g., Daily ${project.name} Check`}
                    value={newReminder.name}
                    onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-field">Specific Field (Optional)</Label>
                  <Select
                    value={newReminder.fieldId || '__general__'}
                    onValueChange={(value) => setNewReminder({ ...newReminder, fieldId: value === '__general__' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general__">General reminder for {project.name}</SelectItem>
                      {project.fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notification-type">Notification Type</Label>
                  <Select
                    value={newReminder.notificationType}
                    onValueChange={(value: NotificationType) => setNewReminder({ ...newReminder, notificationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple reminder</SelectItem>
                      <SelectItem value="custom">Custom message/question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReminder.notificationType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-custom-message">Custom Message/Question</Label>
                    <Textarea
                      id="edit-custom-message"
                      placeholder="e.g., How is your mood today?"
                      value={newReminder.message}
                      onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Other tabs would be similar */}
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingReminder(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateReminder}>
                Update Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}