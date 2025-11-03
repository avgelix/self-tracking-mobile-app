import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Reminder, ReminderFrequency, NotificationType, NotificationSound, NotificationPrivacy, CustomFrequency } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Bell, Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, Volume2, VolumeX, Eye, EyeOff, X } from 'lucide-react';
import { format } from '../utils/dateHelpers';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export function ReminderManager() {
  const { state, addReminder, updateReminder, deleteReminder } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    categoryId: '',
    fieldId: '',
    name: '',
    message: '',
    frequency: 'daily',
    timesOfDay: ['09:00'],
    daysOfWeek: [],
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
    timesOfDay: ['09:00']
  });

  const [newTime, setNewTime] = useState('12:00');

  const handleCreateReminder = () => {
    if (!newReminder.categoryId || !newReminder.name) return;

    const reminderToAdd = {
      ...newReminder,
      customFrequency: newReminder.frequency === 'custom' ? customFreq : undefined
    } as Omit<Reminder, 'id' | 'createdAt' | 'nextDue'>;

    addReminder(reminderToAdd);
    setIsCreateDialogOpen(false);
    resetForm();
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
  };

  const resetForm = () => {
    setNewReminder({
      categoryId: '',
      fieldId: '',
      name: '',
      message: '',
      frequency: 'daily',
      timesOfDay: ['09:00'],
      daysOfWeek: [],
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
      timesOfDay: ['09:00']
    });
    setNewTime('12:00');
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      categoryId: reminder.categoryId,
      fieldId: reminder.fieldId,
      name: reminder.name,
      message: reminder.message,
      frequency: reminder.frequency,
      timesOfDay: reminder.timesOfDay || ['09:00'],
      daysOfWeek: reminder.daysOfWeek || [],
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

  const getCategoryName = (categoryId: string) => {
    const category = state.projects.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getFieldName = (categoryId: string, fieldId?: string) => {
    if (!fieldId) return '';
    const category = state.projects.find(c => c.id === categoryId);
    const field = category?.fields.find(f => f.id === fieldId);
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

  const addTimeSlot = (isCustom = false) => {
    if (isCustom) {
      if (!customFreq.timesOfDay) {
        setCustomFreq({ ...customFreq, timesOfDay: [newTime] });
      } else if (!customFreq.timesOfDay.includes(newTime)) {
        setCustomFreq({ ...customFreq, timesOfDay: [...customFreq.timesOfDay, newTime] });
      }
    } else {
      if (!newReminder.timesOfDay) {
        setNewReminder({ ...newReminder, timesOfDay: [newTime] });
      } else if (!newReminder.timesOfDay.includes(newTime)) {
        setNewReminder({ ...newReminder, timesOfDay: [...newReminder.timesOfDay, newTime] });
      }
    }
  };

  const removeTimeSlot = (time: string, isCustom = false) => {
    if (isCustom) {
      setCustomFreq({ 
        ...customFreq, 
        timesOfDay: customFreq.timesOfDay?.filter(t => t !== time) || [] 
      });
    } else {
      setNewReminder({ 
        ...newReminder, 
        timesOfDay: newReminder.timesOfDay?.filter(t => t !== time) || [] 
      });
    }
  };

  const toggleDayOfWeek = (day: number, isCustom = false) => {
    if (isCustom) {
      const current = customFreq.daysOfWeek || [];
      if (current.includes(day)) {
        setCustomFreq({ ...customFreq, daysOfWeek: current.filter(d => d !== day) });
      } else {
        setCustomFreq({ ...customFreq, daysOfWeek: [...current, day].sort() });
      }
    } else {
      const current = newReminder.daysOfWeek || [];
      if (current.includes(day)) {
        setNewReminder({ ...newReminder, daysOfWeek: current.filter(d => d !== day) });
      } else {
        setNewReminder({ ...newReminder, daysOfWeek: [...current, day].sort() });
      }
    }
  };

  const renderScheduleTab = (isEdit = false) => {
    const times = newReminder.frequency === 'custom' ? customFreq.timesOfDay : newReminder.timesOfDay;
    const days = newReminder.frequency === 'custom' ? customFreq.daysOfWeek : newReminder.daysOfWeek;
    const isCustomFreq = newReminder.frequency === 'custom';

    return (
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

        {/* Time Selection - for all frequencies */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label>Time{(times?.length || 0) > 1 ? 's' : ''} of Day</Label>
            <Badge variant="secondary">{times?.length || 0} time{(times?.length || 0) !== 1 ? 's' : ''}</Badge>
          </div>
          
          {/* Display existing times */}
          {times && times.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {times.map((time, index) => (
                <Badge key={index} variant="outline" className="gap-2 pr-1">
                  <Clock className="w-3 h-3" />
                  {time}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTimeSlot(time, isCustomFreq)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add new time */}
          <div className="flex gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addTimeSlot(isCustomFreq)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add multiple times for reminders throughout the day (e.g., 9:00 AM and 9:00 PM)
          </p>
        </div>

        {/* Days of Week - for weekly frequency or custom */}
        {(newReminder.frequency === 'weekly' || newReminder.frequency === 'custom') && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label>Days of Week</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = days?.includes(day.value) || false;
                return (
                  <Button
                    key={day.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col h-auto py-2"
                    onClick={() => toggleDayOfWeek(day.value, isCustomFreq)}
                  >
                    <span className="text-xs">{day.label}</span>
                  </Button>
                );
              })}
            </div>
            {days && days.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {days.map(d => DAYS_OF_WEEK[d].fullLabel).join(', ')}
              </p>
            )}
            {(!days || days.length === 0) && newReminder.frequency === 'weekly' && (
              <p className="text-xs text-orange-600">
                Please select at least one day for weekly reminders
              </p>
            )}
          </div>
        )}

        {/* Custom Frequency Settings */}
        {newReminder.frequency === 'custom' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
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

        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newReminder.endDate ? format(newReminder.endDate, 'PPP') : 'No end date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={newReminder.endDate}
                onSelect={(date) => setNewReminder({ ...newReminder, endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </TabsContent>
    );
  };

  const renderBasicTab = (isEdit = false) => (
    <TabsContent value="basic" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-reminder-name" : "reminder-name"}>Reminder Name</Label>
        <Input
          id={isEdit ? "edit-reminder-name" : "reminder-name"}
          placeholder="e.g., Daily Water Intake"
          value={newReminder.name}
          onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-category" : "category"}>Project</Label>
        <Select
          value={newReminder.categoryId}
          onValueChange={(value) => setNewReminder({ ...newReminder, categoryId: value, fieldId: '' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {state.projects.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {newReminder.categoryId && (
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-field" : "field"}>Specific Field (Optional)</Label>
          <Select
            value={newReminder.fieldId || '__general__'}
            onValueChange={(value) => setNewReminder({ ...newReminder, fieldId: value === '__general__' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a field or leave empty for general reminder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__general__">General reminder for category</SelectItem>
              {state.projects
                .find(c => c.id === newReminder.categoryId)
                ?.fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-notification-type" : "notification-type"}>Notification Type</Label>
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
          <Label htmlFor={isEdit ? "edit-custom-message" : "custom-message"}>Custom Message/Question</Label>
          <Textarea
            id={isEdit ? "edit-custom-message" : "custom-message"}
            placeholder="e.g., How many glasses of water have you had today?"
            value={newReminder.message}
            onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
          />
        </div>
      )}
    </TabsContent>
  );

  const renderNotificationTab = () => (
    <TabsContent value="notification" className="space-y-4">
      <div className="space-y-4">
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
      </div>
    </TabsContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Reminders</h2>
          <p className="text-muted-foreground">
            Set up notifications to track your data consistently
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder to help you track your data consistently
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="notification">Notification</TabsTrigger>
              </TabsList>

              {renderBasicTab(false)}
              {renderScheduleTab(false)}
              {renderNotificationTab()}
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
      </div>

      {/* Existing Reminders */}
      <div className="space-y-4">
        {state.reminders.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3>No reminders yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first reminder to stay on track with your data collection
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {state.reminders.map((reminder) => (
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
                          {getCategoryName(reminder.categoryId)}
                          {reminder.fieldId && ` • ${getFieldName(reminder.categoryId, reminder.fieldId)}`}
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
                          onClick={() => deleteReminder(reminder.id)}
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
                      
                      {/* Show times */}
                      {reminder.timesOfDay && reminder.timesOfDay.length > 0 && (
                        reminder.timesOfDay.map((time, idx) => (
                          <Badge key={idx} variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {time}
                          </Badge>
                        ))
                      )}

                      {/* Show days for weekly reminders */}
                      {reminder.frequency === 'weekly' && reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {reminder.daysOfWeek.map(d => DAYS_OF_WEEK[d].label).join(', ')}
                        </Badge>
                      )}

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
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReminder} onOpenChange={() => setEditingReminder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Update your reminder settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="notification">Notification</TabsTrigger>
            </TabsList>

            {renderBasicTab(true)}
            {renderScheduleTab(true)}
            {renderNotificationTab()}
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
    </div>
  );
}
