import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Smartphone, Download, Mail } from 'lucide-react';
import { ReminderManager } from './ReminderManager';
import { WidgetManager } from './WidgetManager';
import { NotificationManager } from './NotificationManager';
import { DataManagement } from './DataManagement';

export function Settings() {
  return (
    <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-medium mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your data, set reminders, notifications and widgets.</p>
      </motion.div>

      {/* Settings Tabs */}
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Widgets</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-6 mt-6">
          <ReminderManager />
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6 mt-6">
          <WidgetManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <NotificationManager />
        </TabsContent>

        <TabsContent value="data" className="space-y-6 mt-6">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}