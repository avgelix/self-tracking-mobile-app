import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useApp } from '../contexts/AppContext';
import { UserProfile } from '../types';
import * as api from '../utils/api';
import { 
  User, 
  Mail, 
  CheckCircle,
  BarChart3,
  Bell,
  Target,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Hash,
  Type,
  ToggleRight,
  Sliders,
  ListChecks,
  Calendar,
  Clock,
  CalendarClock,
  Timer,
  Star,
  Link,
  Phone,
  MapPin,
  Palette,
  FileUp,
  Navigation,
  TrendingUp,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { setUserProfile, completeOnboarding, state } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nextUserNumber, setNextUserNumber] = useState<number | null>(null);

  // Fetch the next user number when component loads
  useEffect(() => {
    const fetchUserNumber = async () => {
      try {
        // Test server connectivity first
        console.log('Testing server connectivity...');
        try {
          // Import publicAnonKey for authentication
          const { publicAnonKey } = await import('../utils/supabase/info');
          
          const healthResponse = await fetch(`https://${api.projectId}.supabase.co/functions/v1/make-server-fc010b9b/health`, {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          });
          console.log('Health check status:', healthResponse.status);
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('Health check data:', healthData);
            console.log('Server is responding normally');
            
            if (healthData.kvStoreWorking === false) {
              console.error('KV Store is not working properly');
            }
            if (healthData.environmentVariables) {
              console.log('Environment variables:', healthData.environmentVariables);
            }
          } else {
            console.error('Health check returned non-OK status:', healthResponse.status);
            const errorText = await healthResponse.text();
            console.error('Health check error response:', errorText);
          }
        } catch (healthError) {
          console.error('Health check failed:', healthError);
          console.error('This may indicate the server is not deployed or not accessible');
          // Continue anyway - we'll get a better error from the actual API call
        }
        
        const count = await api.getUserCount();
        console.log('User count fetched successfully:', count);
        setNextUserNumber(count + 1); // Next user will be count + 1
      } catch (error) {
        console.error('Failed to fetch user count:', error);
        console.error('Error type:', error instanceof TypeError ? 'TypeError' : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        setNextUserNumber(null);
      }
    };
    
    fetchUserNumber();
  }, []);

  // Auto-complete after 3 seconds on completion page
  useEffect(() => {
    if (currentStep === 4) {
      const timer = setTimeout(async () => {
        await handleComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const features = [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateForm()) return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Generate a password from email (simplified - in production would be more secure)
      const password = `${formData.email.split('@')[0]}${Date.now()}`;
      
      console.log('Starting signup process for:', formData.email);
      
      // Sign up the user
      const signupResult = await api.signUp(
        formData.email,
        password,
        formData.name,
        formData.surname
      );
      
      console.log('Signup result:', signupResult);
      
      if (!signupResult.success) {
        console.error('Signup failed:', signupResult.error);
        setErrors({ ...errors, signup: signupResult.error || 'Failed to sign up. Please try again.' });
        return;
      }
      
      console.log('Signup successful, proceeding with profile creation');
      
      // Wait a moment for token to be fully set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create user profile with the user number from signup
      const userProfile: UserProfile = {
        name: formData.name,
        surname: formData.surname || undefined,
        email: formData.email,
        completedOnboarding: true,
        createdAt: new Date(),
        userNumber: signupResult.userNumber
      };

      await setUserProfile(userProfile);
      completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderUserInfoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <p className="text-white/70 text-sm text-left max-w-xs mx-auto text-[16px] font-bold font-normal text-[rgb(255,255,255)]">
        Let's get to know each other first:
      </p>

      <div className="space-y-4 max-w-xs mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your first name"
            className={`bg-white/90 ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname" className="text-white">Surname</Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            placeholder="Enter your last name (optional)"
            className="bg-white/90"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email address"
            className={`bg-white/90 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        
        {errors.signup && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-white">{errors.signup}</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderFeatureStep = (featureIndex: number) => {
    const feature = features[featureIndex - 1];
    if (!feature) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="text-center space-y-6"
      >
        <Card className="p-8 bg-white/90 backdrop-blur-xl border-white/40 shadow-lg">
          <div className="space-y-4">
            <div className="mx-auto" style={{ color: feature.iconColor }}>
              {feature.icon}
            </div>
            <h2>{feature.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        </Card>

        <div className="flex justify-center space-x-2">
          {features.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: index === featureIndex - 1 ? 'white' : 'rgba(255, 255, 255, 0.4)'
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  const renderDataTypesShowcase = () => {
    const exampleProjects = [
      { icon: Hash, name: "Daily Steps", type: "Number", color: "#3b82f6", unit: "steps" },
      { icon: Type, name: "Journal", type: "Text", color: "#8b5cf6", unit: "" },
      { icon: ToggleRight, name: "Workout Done", type: "Yes/No", color: "#10b981", unit: "" },
      { icon: Sliders, name: "Mood Rating", type: "Scale", color: "#f59e0b", unit: "1-10" },
      { icon: Star, name: "Book Rating", type: "Rating", color: "#ec4899", unit: "★" },
      { icon: CalendarClock, name: "Sleep Time", type: "Date & Time", color: "#06b6d4", unit: "" },
      { icon: Timer, name: "Study Duration", type: "Duration", color: "#14b8a6", unit: "" },
      { icon: ListChecks, name: "Daily Tasks", type: "Checklist", color: "#6366f1", unit: "" },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-white text-[20px]">Track <em>literally</em> anything</h2>
          <p className="text-white/80 text-sm">Track anything with the perfect input type</p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {exampleProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <project.icon className="w-4 h-4" style={{ color: project.color }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm line-clamp-1">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.type}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-4 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm">Plus many more:</p>
              <p className="text-xs text-muted-foreground">
                Links, Phone numbers, Colors, Files, Locations, Path recording, Tally counters, and unlimited nested subfields!
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderDataVizShowcase = () => {
    const lineData = [
      { day: 'Mon', happy: 65, calm: 45, energetic: 70, stressed: 30 },
      { day: 'Tue', happy: 72, calm: 55, energetic: 65, stressed: 25 },
      { day: 'Wed', happy: 68, calm: 60, energetic: 60, stressed: 35 },
      { day: 'Thu', happy: 85, calm: 70, energetic: 80, stressed: 20 },
      { day: 'Fri', happy: 78, calm: 65, energetic: 85, stressed: 15 },
      { day: 'Sat', happy: 92, calm: 80, energetic: 75, stressed: 10 },
      { day: 'Sun', happy: 88, calm: 85, energetic: 70, stressed: 12 },
    ];

    const barData = [
      { category: 'Work', hours: 8.5 },
      { category: 'Exercise', hours: 1.5 },
      { category: 'Sleep', hours: 7.2 },
      { category: 'Hobby', hours: 2.8 },
    ];

    const pieData = [
      { name: 'Completed', value: 75, color: '#10b981' },
      { name: 'In Progress', value: 15, color: '#f59e0b' },
      { name: 'Pending', value: 10, color: '#ef4444' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-white text-[20px]">See where you are going</h2>
          <p className="text-white/80 text-sm">See your progress come to life with stunning charts</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Line Chart */}
          <div>
            <Card className="p-4 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <p className="text-sm">Mood Trends</p>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={lineData}>
                    <Line 
                      type="monotone" 
                      dataKey="happy" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', r: 3 }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="calm" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energetic" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 3 }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stressed" 
                      stroke="#ef4444" 
                      strokeWidth={2.5}
                      dot={{ fill: '#ef4444', r: 3 }}
                      animationDuration={1500}
                    />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Bar Chart */}
          <div>
            <Card className="p-4 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-500" />
                  <p className="text-sm">Time Distribution</p>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={barData}>
                    <Bar 
                      dataKey="hours" 
                      fill="#8b5cf6" 
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                    />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis hide />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Area Chart */}
          <div>
            <Card className="p-4 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm">Weekly Activity</p>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={lineData}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="energetic" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#colorActivity)"
                      animationDuration={1500}
                    />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis hide />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderWidgetsRemindersShowcase = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-white text-[20px]">Track on the go</h2>
          <p className="text-white/80 text-sm">Quick widgets and smart reminders keep you consistent</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Home Screen Widget Preview */}
          <div>
            <Card className="p-5 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <p className="text-sm">Home Screen Widget</p>
                </div>
                
                {/* Widget Mockup */}
                <div className="space-y-3">
                  {/* Counter Widget */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-4 shadow-xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-white/80">Daily Steps</p>
                            <p className="text-2xl text-white">8,547</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">Goal</p>
                          <p className="text-sm text-white">10,000</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-white/30 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm text-white text-xs py-2.5 rounded-xl transition-all shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center">
                          +100
                        </button>
                        <button className="flex-1 bg-white/30 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm text-white text-xs py-2.5 rounded-xl transition-all shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center">
                          +500
                        </button>
                        <button className="flex-1 bg-white/30 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm text-white text-xs py-2.5 rounded-xl transition-all shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center">
                          +1000
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mood Widget */}
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-4 shadow-xl">
                    <div className="space-y-2">
                      <p className="text-xs text-white/80">How are you feeling?</p>
                      <div className="grid grid-cols-5 gap-2">
                        {['😊', '😌', '😐', '😔', '😴'].map((emoji, i) => (
                          <button
                            key={i}
                            className="aspect-square bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl transition-all"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Widget */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white">Workout Complete</p>
                          <p className="text-xs text-white/70">Tap to log today</p>
                        </div>
                      </div>
                      <div className="w-12 h-7 bg-white/30 rounded-full flex items-center px-1">
                        <div className="w-5 h-5 bg-white rounded-full shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Log data instantly without opening the app
                </p>
              </div>
            </Card>
          </div>

          {/* Notification Reminder Preview */}
          <div>
            <Card className="p-5 bg-white/95 backdrop-blur-xl border-white/40 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm">Smart Reminders</p>
                </div>
                
                {/* Notification Mockups - iOS/Android Style */}
                <div className="space-y-3">
                  {/* Notification 1 */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-gray-200/50">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs opacity-90">Whatever</p>
                          <p className="text-[10px] text-muted-foreground">now</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          How stressed do you feel today? 🧘
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button className="text-[10px] px-3 py-1.5 bg-emerald-500 text-white rounded-lg shadow-sm">
                            Log Now
                          </button>
                          <button className="text-[10px] px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                            Remind me later
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Set custom reminder messages for each project
                </p>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCompletionStep = () => {
    // Create explosion of particles
    const particles = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2;
      const distance = 120 + Math.random() * 60;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: i * 0.02,
        duration: 0.8 + Math.random() * 0.4,
        size: 8 + Math.random() * 8,
        color: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'][Math.floor(Math.random() * 4)]
      };
    });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center relative min-h-[500px] flex items-center justify-center"
      >
        {/* Particle explosion */}
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 0 
            }}
            animate={{ 
              x: particle.x,
              y: particle.y,
              scale: [0, 1.2, 0.8],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Concentric circle ripples */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/40"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ 
              width: 400,
              height: 400,
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Main content */}
        <div className="relative z-10">
          <Card className="p-10 bg-white/98 backdrop-blur-xl border-white/60 shadow-[0_20px_70px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Gradient shimmer - static */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(45deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
              }}
            />

            <div className="space-y-6 relative">
              {/* Checkmark */}
              <div>
                <div className="relative inline-block">
                  {/* Glow layers */}
                  <div
                    className="absolute inset-0 rounded-full blur-3xl opacity-50"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-70"
                    style={{ backgroundColor: '#60a5fa' }}
                  />
                  <div>
                    <CheckCircle className="w-32 h-32 mx-auto relative" style={{ color: '#3b82f6' }} strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="space-y-4">
                <h2 className="text-gray-900 text-[40px] leading-tight">
                  Welcome, <br />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {formData.name}!
                  </span>
                </h2>
              </div>

              {/* Sparkle icons */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <Star 
                      className="w-6 h-6" 
                      style={{ color: '#3b82f6' }} 
                      fill="#3b82f6"
                      strokeWidth={0}
                    />
                  </div>
                ))}
              </div>

              {/* Text */}
              <p className="text-[18px] text-gray-700">
                Your journey begins now
              </p>

              {/* Progress indicator */}
              <div className="pt-4">
                <div 
                  className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto"
                  style={{ maxWidth: '200px', width: '100%' }}
                />
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  };

  // Determine background color based on current step
  const getBackgroundColor = () => {
    if (currentStep === 0) return '#3b82f6'; // blue for user info
    if (currentStep === 1) return '#8b5cf6'; // violet for data types showcase
    if (currentStep === 2) return '#f59e0b'; // amber for data viz showcase
    if (currentStep === 3) return '#10b981'; // green for widgets & reminders showcase
    return '#3b82f6'; // blue for completion (same as home page header)
  };

  return (
    <motion.div 
      className="min-h-screen flex justify-center px-4 transition-colors duration-700"
      style={{ backgroundColor: getBackgroundColor() }}
      animate={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="w-full min-h-screen flex flex-col">
        {/* Header Section - Whatever + Welcome */}
        <div className="pt-8 text-center space-y-4">
          <motion.h1 
            className="text-white text-6xl font-black tracking-tight leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Whatever
          </motion.h1>
          
          {currentStep === 0 && (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <p className="text-white/90 text-lg font-medium">
                you are the <span className="text-3xl">#{nextUserNumber || '...'}</span> to get here
              </p>
            </motion.div>
          )}
        </div>

        {/* Animated Icons Section */}
        {currentStep === 0 && (
          <div className="relative h-64 my-12 overflow-hidden">
            {[
              { Icon: Hash, delay: 0, x: -90 },
              { Icon: Type, delay: 0.6, x: 90 },
              { Icon: ToggleRight, delay: 1.2, x: -90 },
              { Icon: BarChart3, delay: 1.8, x: 90 },
              { Icon: Sliders, delay: 2.4, x: -90 },
              { Icon: ListChecks, delay: 3.0, x: 90 },
              { Icon: Calendar, delay: 3.6, x: -90 },
              { Icon: Clock, delay: 4.2, x: 90 }
            ].map(({ Icon, delay, x }, index) => (
              <motion.div
                key={index}
                className="absolute left-1/2 top-0"
                initial={{ opacity: 0, x: x, y: -50, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 1, 0],
                  x: [x, x, x, x, x],
                  y: [-50, 30, 130, 230, 330],
                  scale: [0, 1, 1, 1, 0.8],
                  rotate: [0, 2, -2, 3, 0]
                }}
                transition={{
                  duration: 5,
                  delay: delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Icon className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={2} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center px-4 pb-32 pt-6">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {currentStep === 0 && renderUserInfoStep()}
              {currentStep === 1 && renderDataTypesShowcase()}
              {currentStep === 2 && renderDataVizShowcase()}
              {currentStep === 3 && renderWidgetsRemindersShowcase()}
              {currentStep === 4 && renderCompletionStep()}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Navigation - Hide on completion page (step 4) */}
        {currentStep !== 4 && (
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
            {/* Gradient fade to ensure visibility */}
            <div 
              className="h-12 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, transparent, ${getBackgroundColor()})`
              }}
            />
            <div 
              className="py-6 px-4 pointer-events-auto"
              style={{ backgroundColor: getBackgroundColor() }}
            >
              <div className="max-w-md mx-auto flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <div className="text-sm text-white/90 font-medium">
                  {currentStep + 1} of 5
                </div>

                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-white text-gray-900 hover:bg-white/90 disabled:opacity-50"
                  disabled={currentStep === 0 && (!formData.name.trim() || !formData.email.trim())}
                >
                  {currentStep === 3 ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}