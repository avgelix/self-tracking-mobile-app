import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Reminder, PendingNotification } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Separator } from './ui/separator';
import { Bell, BellRing, Clock, X, Check, Volume2, VolumeX, Eye, EyeOff, MessageSquare, Mail } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from '../utils/dateHelpers';
import { toast } from 'sonner@2.0.3';

export function NotificationManager() {
  const { 
    state, 
    scheduleNotification, 
    markNotificationDelivered, 
    dismissNotification,
    updateReminder 
  } = useApp();
  
  const [activeNotifications, setActiveNotifications] = useState<PendingNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<PendingNotification | null>(null);

  // Check for due reminders and create notifications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      state.reminders.forEach(reminder => {
        if (!reminder.isActive) return;
        
        // Check if reminder is due
        if (reminder.nextDue <= now) {
          // Check if we already have a pending notification for this reminder
          const existingNotification = state.pendingNotifications.find(
            notif => notif.reminderId === reminder.id && !notif.delivered && !notif.dismissed
          );
          
          if (!existingNotification) {
            // Create new notification
            scheduleNotification(reminder.id, now);
            
            // Calculate next due time
            const nextDue = calculateNextDue(reminder);
            updateReminder(reminder.id, { nextDue });
            
            // Show browser notification if supported
            showBrowserNotification(reminder);
          }
        }
      });
    };

    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Check immediately
    checkReminders();
    
    return () => clearInterval(interval);
  }, [state.reminders, state.pendingNotifications]);

  // Update active notifications
  useEffect(() => {
    const active = state.pendingNotifications.filter(
      notif => !notif.delivered && !notif.dismissed
    );
    setActiveNotifications(active);
  }, [state.pendingNotifications]);

  const calculateNextDue = (reminder: Reminder): Date => {
    const now = new Date();
    
    switch (reminder.frequency) {
      case 'once':
        return new Date(reminder.endDate || reminder.startDate);
      case 'daily':
        const nextDaily = new Date(reminder.nextDue);
        nextDaily.setDate(nextDaily.getDate() + 1);
        return nextDaily;
      case 'weekly':
        const nextWeekly = new Date(reminder.nextDue);
        nextWeekly.setDate(nextWeekly.getDate() + 7);
        return nextWeekly;
      case 'monthly':
        const nextMonthly = new Date(reminder.nextDue);
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        return nextMonthly;
      case 'custom':
        if (reminder.customFrequency) {
          const { interval, unit } = reminder.customFrequency;
          const nextCustom = new Date(reminder.nextDue);
          switch (unit) {
            case 'minutes':
              nextCustom.setMinutes(nextCustom.getMinutes() + interval);
              break;
            case 'hours':
              nextCustom.setHours(nextCustom.getHours() + interval);
              break;
            case 'days':
              nextCustom.setDate(nextCustom.getDate() + interval);
              break;
            case 'weeks':
              nextCustom.setDate(nextCustom.getDate() + (interval * 7));
              break;
            case 'months':
              nextCustom.setMonth(nextCustom.getMonth() + interval);
              break;
          }
          return nextCustom;
        }
        return new Date(reminder.nextDue);
      default:
        return new Date(reminder.nextDue);
    }
  };

  const showBrowserNotification = (reminder: Reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const category = state.categories.find(c => c.id === reminder.categoryId);
      const title = reminder.privacy === 'private' ? 'Tracking Reminder' : reminder.name;
      const body = reminder.privacy === 'private' 
        ? 'You have a tracking reminder'
        : reminder.message || `Time to track ${category?.name}`;
      
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png', // Assuming you have an app icon
        badge: '/badge-72.png',
        tag: reminder.id,
        requireInteraction: true,
        silent: !reminder.soundEnabled
      });

      notification.onclick = () => {
        window.focus();
        setSelectedNotification(
          state.pendingNotifications.find(n => n.reminderId === reminder.id) || null
        );
        notification.close();
      };

      // Auto-close after 10 seconds if not interactive
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notifications denied. You can enable them in your browser settings.');
      }
    }
  };

  const handleMarkAsRead = (notification: PendingNotification) => {
    markNotificationDelivered(notification.id);
    toast.success('Notification marked as read');
  };

  const handleDismiss = (notification: PendingNotification) => {
    dismissNotification(notification.id);
    setSelectedNotification(null);
    toast.success('Notification dismissed');
  };

  const handleSnooze = (notification: PendingNotification, minutes: number) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
    
    // Create a new notification for the snooze time
    scheduleNotification(notification.reminderId, snoozeUntil);
    
    // Dismiss the current notification
    dismissNotification(notification.id);
    setSelectedNotification(null);
    
    toast.success(`Reminder snoozed for ${minutes} minutes`);
  };

  const getReminder = (notificationId: string) => {
    const notification = state.pendingNotifications.find(n => n.id === notificationId);
    if (!notification) return null;
    return state.reminders.find(r => r.id === notification.reminderId);
  };

  const getCategory = (reminder: Reminder) => {
    return state.categories.find(c => c.id === reminder.categoryId);
  };

  const formatNotificationTime = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d at h:mm a');
    }
  };

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't auto-request, let user trigger it
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Notifications</h2>
          <p className="text-muted-foreground">
            Manage your reminder notifications
          </p>
        </div>
        
        {('Notification' in window && Notification.permission !== 'granted') && (
          <Button onClick={requestNotificationPermission} className="gap-2">
            <Mail className="w-4 h-4" />
            Enable Notifications
          </Button>
        )}
      </div>

      {/* Notification Permission Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <div className="flex-1">
              <div className="font-medium">Browser Notifications</div>
              <div className="text-sm text-muted-foreground">
                {('Notification' in window) ? (
                  Notification.permission === 'granted' ? (
                    'Enabled - You\'ll receive browser notifications for reminders'
                  ) : Notification.permission === 'denied' ? (
                    'Disabled - Enable in your browser settings to receive notifications'
                  ) : (
                    'Not enabled - Click the button above to enable notifications'
                  )
                ) : (
                  'Not supported in this browser'
                )}
              </div>
            </div>
            <Badge 
              variant={
                ('Notification' in window && Notification.permission === 'granted') 
                  ? 'default' 
                  : 'secondary'
              }
            >
              {('Notification' in window) ? (
                Notification.permission === 'granted' ? 'Enabled' :
                Notification.permission === 'denied' ? 'Denied' : 'Disabled'
              ) : 'Not Supported'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Active Notifications */}
      {activeNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              Active Notifications
              <Badge variant="destructive">{activeNotifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeNotifications.map((notification) => {
              const reminder = getReminder(notification.id);
              const category = reminder ? getCategory(reminder) : null;
              
              if (!reminder || !category) return null;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 border rounded-lg bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{category.icon}</span>
                        <div className="font-medium">
                          {reminder.privacy === 'private' ? 'Tracking Reminder' : reminder.name}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatNotificationTime(notification.scheduledFor)}
                        </Badge>
                      </div>
                      
                      {reminder.privacy === 'public' && reminder.message && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {reminder.message}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{category.name}</span>
                        {reminder.soundEnabled ? (
                          <Volume2 className="w-3 h-3" />
                        ) : (
                          <VolumeX className="w-3 h-3" />
                        )}
                        {reminder.showOnHomeScreen ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notification)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}



      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              Reminder Notification
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (() => {
            const reminder = getReminder(selectedNotification.id);
            const category = reminder ? getCategory(reminder) : null;
            
            if (!reminder || !category) return null;

            return (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-lg">
                    {reminder.privacy === 'private' ? 'Tracking Reminder' : reminder.name}
                  </h3>
                  <p className="text-muted-foreground">{category.name}</p>
                </div>

                {reminder.privacy === 'public' && reminder.message && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{reminder.message}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSnooze(selectedNotification, 5)}
                    size="sm"
                  >
                    Snooze 5m
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSnooze(selectedNotification, 15)}
                    size="sm"
                  >
                    Snooze 15m
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSnooze(selectedNotification, 30)}
                    size="sm"
                  >
                    Snooze 30m
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSnooze(selectedNotification, 60)}
                    size="sm"
                  >
                    Snooze 1h
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAsRead(selectedNotification)}
                    className="flex-1"
                  >
                    Mark as Read
                  </Button>
                  <Button
                    onClick={() => {
                      // Navigate to quick track for this category
                      window.dispatchEvent(new CustomEvent('quickTrack'));
                      handleDismiss(selectedNotification);
                    }}
                    className="flex-1"
                  >
                    Track Now
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}