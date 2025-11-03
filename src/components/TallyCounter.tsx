import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Plus, Minus, RotateCcw, Smartphone, Settings } from 'lucide-react';
import { TallyData } from '../types';

interface TallyCounterProps {
  value?: TallyData | null;
  onChange: (tally: TallyData) => void;
  fieldId: string;
  fieldName: string;
  widgetEnabled?: boolean;
  onWidgetToggle?: (enabled: boolean) => void;
  className?: string;
}

export function TallyCounter({ 
  value, 
  onChange, 
  fieldId, 
  fieldName,
  widgetEnabled = false,
  onWidgetToggle,
  className 
}: TallyCounterProps) {
  const [currentTally, setCurrentTally] = useState<TallyData>(
    value || { count: 0, increments: [] }
  );
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      setCurrentTally(value);
    }
  }, [value]);

  // Increment counter
  const increment = (amount: number = incrementAmount) => {
    const newTally: TallyData = {
      count: currentTally.count + amount,
      increments: [
        ...currentTally.increments,
        {
          timestamp: Date.now(),
          amount
        }
      ]
    };
    setCurrentTally(newTally);
    onChange(newTally);
    
    // Store for potential widget use
    if (widgetEnabled) {
      localStorage.setItem(`tally_${fieldId}`, JSON.stringify(newTally));
    }
  };

  // Decrement counter
  const decrement = (amount: number = incrementAmount) => {
    const newCount = Math.max(0, currentTally.count - amount);
    const newTally: TallyData = {
      count: newCount,
      increments: [
        ...currentTally.increments,
        {
          timestamp: Date.now(),
          amount: -amount
        }
      ]
    };
    setCurrentTally(newTally);
    onChange(newTally);
    
    if (widgetEnabled) {
      localStorage.setItem(`tally_${fieldId}`, JSON.stringify(newTally));
    }
  };

  // Reset counter
  const reset = () => {
    const newTally: TallyData = {
      count: 0,
      increments: []
    };
    setCurrentTally(newTally);
    onChange(newTally);
    
    if (widgetEnabled) {
      localStorage.removeItem(`tally_${fieldId}`);
    }
  };

  // Set specific count
  const setCount = (count: number) => {
    const newTally: TallyData = {
      count: Math.max(0, count),
      increments: [
        ...currentTally.increments,
        {
          timestamp: Date.now(),
          amount: count - currentTally.count
        }
      ]
    };
    setCurrentTally(newTally);
    onChange(newTally);
    
    if (widgetEnabled) {
      localStorage.setItem(`tally_${fieldId}`, JSON.stringify(newTally));
    }
  };

  // Generate widget HTML for home screen
  const generateWidgetHTML = () => {
    const widgetHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fieldName} Tally Widget</title>
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .widget {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 280px;
            width: 100%;
        }
        .title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #333;
        }
        .count {
            font-size: 48px;
            font-weight: 700;
            color: #667eea;
            margin: 16px 0;
        }
        .button {
            background: #667eea;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin: 8px 0;
            transition: all 0.2s;
        }
        .button:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        .button:active {
            transform: translateY(0);
        }
        .open-app {
            background: transparent;
            color: #667eea;
            border: 2px solid #667eea;
            font-size: 14px;
            padding: 12px 20px;
            margin-top: 16px;
        }
        .open-app:hover {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="widget">
        <div class="title">${fieldName}</div>
        <div class="count" id="count">0</div>
        <button class="button" onclick="increment()">+ Add One</button>
        <button class="button open-app" onclick="openApp()">Open Full App</button>
    </div>

    <script>
        let count = 0;
        
        // Load saved count
        function loadCount() {
            const saved = localStorage.getItem('tally_${fieldId}');
            if (saved) {
                const data = JSON.parse(saved);
                count = data.count || 0;
                document.getElementById('count').textContent = count;
            }
        }
        
        // Save count
        function saveCount() {
            const data = {
                count: count,
                increments: JSON.parse(localStorage.getItem('tally_${fieldId}') || '{"increments": []}').increments || []
            };
            data.increments.push({
                timestamp: Date.now(),
                amount: 1
            });
            localStorage.setItem('tally_${fieldId}', JSON.stringify(data));
        }
        
        // Increment function
        function increment() {
            count++;
            document.getElementById('count').textContent = count;
            saveCount();
            
            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
        
        // Open main app
        function openApp() {
            // Try to open the main app (this would be customized based on deployment)
            window.open(window.location.origin, '_blank');
        }
        
        // Load count on page load
        loadCount();
        
        // Refresh count every 5 seconds in case it was updated elsewhere
        setInterval(loadCount, 5000);
    </script>
</body>
</html>`;
    
    return widgetHTML;
  };

  // Download widget
  const downloadWidget = () => {
    const html = generateWidgetHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fieldName.toLowerCase().replace(/\s+/g, '-')}-tally-widget.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get today's increments
  const getTodayIncrements = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    return currentTally.increments.filter(inc => inc.timestamp >= todayTimestamp);
  };

  const todayIncrements = getTodayIncrements();
  const todayCount = todayIncrements.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <Card className={`p-4 bg-white/60 backdrop-blur-sm border-white/30 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              {currentTally.count}
            </div>
            <span className="font-medium">Tally Counter</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 p-3 rounded-lg space-y-3"
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="increment-amount" className="text-sm">
                Increment Amount:
              </Label>
              <Input
                id="increment-amount"
                type="number"
                min="1"
                value={incrementAmount}
                onChange={(e) => setIncrementAmount(Number(e.target.value) || 1)}
                className="w-20 h-8"
              />
            </div>
            
            {onWidgetToggle && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <Label htmlFor="widget-enabled" className="text-sm">
                    Enable Home Screen Widget
                  </Label>
                </div>
                <Switch
                  id="widget-enabled"
                  checked={widgetEnabled}
                  onCheckedChange={onWidgetToggle}
                />
              </div>
            )}
            
            {widgetEnabled && (
              <Button
                onClick={downloadWidget}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Download Widget
              </Button>
            )}
          </motion.div>
        )}

        {/* Current count display */}
        <div className="text-center py-6">
          <motion.div
            key={currentTally.count}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold text-blue-600 mb-2"
          >
            {currentTally.count}
          </motion.div>
          <div className="text-sm text-muted-foreground">
            Total Count
          </div>
          {todayCount > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              +{todayCount} today
            </div>
          )}
        </div>

        {/* Manual count input */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">Set count:</Label>
          <Input
            type="number"
            min="0"
            value={currentTally.count}
            onChange={(e) => setCount(Number(e.target.value) || 0)}
            className="flex-1"
          />
        </div>

        {/* Control buttons */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => decrement()}
              variant="outline"
              className="w-full h-12"
              disabled={currentTally.count === 0}
            >
              <Minus className="w-5 h-5" />
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => increment()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-1" />
              {incrementAmount > 1 ? incrementAmount : ''}
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={reset}
              variant="outline"
              className="w-full h-12"
              disabled={currentTally.count === 0}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Widget status */}
        {widgetEnabled && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="font-medium">Widget Active</span>
            </div>
            <div className="text-xs mt-1">
              You can record tallies from your home screen widget even when the app is closed.
            </div>
          </div>
        )}

        {/* Recent activity */}
        {currentTally.increments.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Recent Activity:</div>
            <div className="space-y-1">
              {currentTally.increments.slice(-3).reverse().map((increment, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>
                    {increment.amount > 0 ? '+' : ''}{increment.amount}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(increment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}