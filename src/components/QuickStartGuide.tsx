import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Tag, Bell, Smartphone, Zap, CheckCircle } from 'lucide-react';

const QUICK_START_STEPS = [
  {
    id: 'categories',
    title: 'Create Projects',
    description: 'Set up tracking projects for things you want to monitor',
    icon: Tag,
    action: 'Create your first project',
    completed: false
  },
  {
    id: 'reminders',
    title: 'Set Reminders',
    description: 'Never forget to track your data with smart notifications',
    icon: Bell,
    action: 'Add a reminder',
    completed: false
  },
  {
    id: 'widgets',
    title: 'Quick Entry Widgets',
    description: 'Add home screen widgets for instant data entry',
    icon: Smartphone,
    action: 'Create widgets',
    completed: false
  }
];

interface QuickStartGuideProps {
  onDismiss: () => void;
  onNavigate: (section: string) => void;
  categoriesCount: number;
  remindersCount: number;
  widgetsCount: number;
}

export function QuickStartGuide({ 
  onDismiss, 
  onNavigate, 
  categoriesCount, 
  remindersCount, 
  widgetsCount 
}: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = QUICK_START_STEPS.map(step => ({
    ...step,
    completed: 
      (step.id === 'categories' && categoriesCount > 0) ||
      (step.id === 'reminders' && remindersCount > 0) ||
      (step.id === 'widgets' && widgetsCount > 0)
  }));

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleStepAction = (stepId: string) => {
    switch (stepId) {
      case 'categories':
        onNavigate('categories');
        break;
      case 'reminders':
        onNavigate('reminders');
        break;
      case 'widgets':
        onNavigate('widgets');
        break;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (completedSteps === steps.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                Setup Complete!
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-700">
                🎉 Great job! You've completed the initial setup. You're ready to start tracking!
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={onDismiss}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Tracking
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate('widgets')}
                >
                  View Widgets
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Quick Start Guide
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{completedSteps}/{steps.length} steps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Current Step */}
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = step.completed;
                  
                  return (
                    <motion.div
                      key={step.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isActive 
                          ? 'border-blue-300 bg-blue-50/50' 
                          : isCompleted
                          ? 'border-green-300 bg-green-50/50'
                          : 'border-gray-200 bg-gray-50/50'
                      } ${!isActive ? 'opacity-60' : ''}`}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                        opacity: isActive ? 1 : 0.6
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{step.title}</h4>
                            {isCompleted && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {step.description}
                          </p>
                          {isActive && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleStepAction(step.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {step.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep 
                          ? 'bg-blue-600' 
                          : steps[index].completed 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}