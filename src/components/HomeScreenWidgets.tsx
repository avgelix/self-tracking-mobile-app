import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { QuickEntryWidget } from './widgets/QuickEntryWidget';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Smartphone, Settings, Grid3x3, Eye, EyeOff } from 'lucide-react';

export function HomeScreenWidgets() {
  const { state } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const activeWidgets = state.widgets.filter(widget => widget.isEnabled);

  const handleOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('openSettings'));
  };

  if (activeWidgets.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3>No Active Widgets</h3>
          <p className="text-muted-foreground mb-4">
            Create widgets in settings to enable quick data entry from your home screen
          </p>
          <Button onClick={handleOpenSettings} className="gap-2">
            <Settings className="w-4 h-4" />
            Setup Widgets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Quick Entry Widgets</h2>
          <p className="text-muted-foreground">
            Fast access to your most important tracking data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSettings}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage
          </Button>
        </div>
      </div>

      {/* Home Screen Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Home Screen Preview
                </CardTitle>
              </CardHeader>
              <div className="relative w-full max-w-xs mx-auto aspect-[9/16] bg-black rounded-3xl p-1">
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[22px] p-4 overflow-hidden">
                  <div className="text-center text-xs text-muted-foreground mb-4">
                    iOS Home Screen
                  </div>
                  <div className="grid grid-cols-4 gap-2 auto-rows-min">
                    {activeWidgets.map((widget) => (
                      <div
                        key={widget.id}
                        className={`
                          ${widget.size === 'small' ? 'col-span-1 row-span-1' : ''}
                          ${widget.size === 'medium' ? 'col-span-2 row-span-1' : ''}
                          ${widget.size === 'large' ? 'col-span-2 row-span-2' : ''}
                        `}
                        style={{
                          gridColumnStart: Math.floor(widget.position.x / 25) + 1,
                          gridRowStart: Math.floor(widget.position.y / 25) + 1,
                        }}
                      >
                        <QuickEntryWidget
                          widget={widget}
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          <h3>Available Widgets</h3>
          <Badge variant="secondary">{activeWidgets.length}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {activeWidgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <QuickEntryWidget
                  widget={widget}
                  className={`
                    w-full aspect-square
                    ${selectedWidget === widget.id ? 'ring-2 ring-primary' : ''}
                  `}
                />
                
                {/* Widget Info Overlay */}
                <motion.div
                  className="absolute inset-0 bg-black/80 text-white p-2 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center text-center"
                  whileHover={{ opacity: 1 }}
                >
                  <div className="text-sm font-medium truncate">{widget.name}</div>
                  <div className="text-xs text-gray-300 truncate">
                    {state.categories.find(c => c.id === widget.categoryId)?.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {widget.size} • {widget.type}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="gap-2 p-4 h-auto flex-col"
              onClick={handleOpenSettings}
            >
              <Settings className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Manage Widgets</div>
                <div className="text-sm text-muted-foreground">Add, edit, or remove widgets</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 p-4 h-auto flex-col"
              onClick={() => window.dispatchEvent(new CustomEvent('quickTrack'))}
            >
              <Grid3x3 className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Quick Track</div>
                <div className="text-sm text-muted-foreground">Open full tracking interface</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Widget Tips</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Tap widgets for quick data entry without opening the app</li>
                <li>• Use different sizes to prioritize your most important metrics</li>
                <li>• Enable/disable widgets based on your current tracking goals</li>
                <li>• Widgets with green dots support instant data entry</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}