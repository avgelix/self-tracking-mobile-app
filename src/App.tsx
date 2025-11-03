import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider } from './contexts/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Entries } from './components/AddEntry';
import { Charts } from './components/Charts';
import { Projects } from './components/Projects';
import { Settings } from './components/Settings';
import { FloatingActionButton } from './components/FloatingActionButton';
import { SyncIndicator } from './components/SyncIndicator';
import { Toaster } from './components/ui/sonner';
import { Onboarding } from './components/Onboarding';
import { useApp } from './contexts/AppContext';
import { Project } from './types';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

function AppContent() {
  const { state, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | null>(null);

  // Listen for custom events to change tabs
  useEffect(() => {
    const handleOpenSettings = () => {
      setActiveTab('settings');
    };

    const handleQuickTrack = (event: any) => {
      const categoryId = event.detail?.categoryId;
      if (categoryId) {
        setPreselectedCategoryId(categoryId);
      }
      setActiveTab('entries');
    };

    const handleNavigateToTab = (event: any) => {
      const tab = event.detail?.tab;
      if (tab) {
        setActiveTab(tab);
      }
    };

    window.addEventListener('openSettings', handleOpenSettings);
    window.addEventListener('quickTrack', handleQuickTrack);
    window.addEventListener('navigateToTab', handleNavigateToTab);
    
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
      window.removeEventListener('quickTrack', handleQuickTrack);
      window.removeEventListener('navigateToTab', handleNavigateToTab);
    };
  }, []);

  // Reset selected project when changing tabs away from projects
  useEffect(() => {
    if (activeTab !== 'projects') {
      setSelectedProject(null);
    }
  }, [activeTab]);

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-600">Loading Whatever...</p>
        </div>
      </div>
    );
  }

  // Check if user needs onboarding (must be after all hooks)
  const needsOnboarding = !state.userProfile || !state.userProfile.completedOnboarding;

  if (needsOnboarding) {
    return <Onboarding onComplete={() => {}} />;
  }

  // Generate dynamic background gradient based on selected project color
  const generateBackgroundGradient = (color?: string) => {
    if (!color) {
      return {
        background: 'linear-gradient(135deg, rgb(239 246 255) 0%, rgb(255 255 255) 50%, rgb(250 245 255) 100%)'
      };
    }

    // Convert hex color to HSL-like values for gradient generation
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [h * 360, s * 100, l * 100];
    };

    const [hue, saturation, lightness] = hexToHsl(color);
    
    // Create a bold, immersive gradient prominently featuring the project color
    const primaryColor = color; // Use the actual project color
    const primaryLight = `${color}25`; // 15% opacity of project color
    const primaryMedium = `${color}35`; // 21% opacity of project color
    const primaryStrong = `${color}45`; // 27% opacity of project color
    
    // Generate complementary colors based on the project color
    const lightVariant = `hsl(${hue}, ${Math.min(saturation * 1.2, 90)}%, ${Math.min(lightness * 1.6, 92)}%)`;
    const mediumVariant = `hsl(${hue}, ${Math.min(saturation * 1.1, 85)}%, ${Math.min(lightness * 1.3, 85)}%)`;
    const darkVariant = `hsl(${hue}, ${Math.min(saturation * 1.15, 88)}%, ${Math.max(lightness * 0.8, 25)}%)`;
    const accentColor = `hsl(${(hue + 25) % 360}, ${Math.min(saturation * 1.1, 85)}%, ${Math.min(lightness * 1.4, 88)}%)`;
    const complementaryColor = `hsl(${(hue + 180) % 360}, ${saturation * 0.6}%, ${lightness * 1.5}%)`;
    
    return {
      background: `
        radial-gradient(ellipse 1200px 800px at top left, ${lightVariant} 0%, transparent 40%),
        radial-gradient(ellipse 1000px 600px at top right, ${accentColor} 0%, transparent 45%),
        radial-gradient(ellipse 800px 1000px at bottom left, ${mediumVariant} 0%, transparent 50%),
        radial-gradient(ellipse 900px 700px at bottom right, ${complementaryColor} 0%, transparent 40%),
        radial-gradient(ellipse 600px 400px at center, ${primaryStrong} 0%, transparent 60%),
        linear-gradient(125deg, ${primaryLight} 0%, ${lightVariant} 20%, ${primaryMedium} 40%, ${mediumVariant} 60%, ${primaryLight} 80%, ${accentColor} 100%)
      `
    };
  };

  const handleProjectSelect = (project: Project | null) => {
    setSelectedProject(project);
    if (!project && activeTab === 'projects') {
      // Refresh projects page when backing out of a project
      setActiveTab('projects');
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'entries':
        return <Entries preselectedCategoryId={preselectedCategoryId} onCategorySelected={() => setPreselectedCategoryId(null)} />;
      case 'charts':
        return <Charts />;
      case 'projects':
        return <Projects onProjectSelect={handleProjectSelect} selectedProject={selectedProject} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const backgroundStyle = generateBackgroundGradient(selectedProject?.color);

  // Tab color mapping for dynamic button colors
  const getTabColor = (tab: string) => {
    const tabColors: Record<string, string> = {
      home: '#3b82f6',      // blue-500
      entries: '#10b981',    // green-500
      charts: '#f59e0b',     // amber-500
      projects: '#8b5cf6',   // violet-500
      settings: '#6b7280'    // gray-500
    };
    return tabColors[tab] || '#3b82f6';
  };

  const pageColor = getTabColor(activeTab);

  return (
    <div 
      className="min-h-screen transition-all duration-700 ease-in-out"
      style={{
        ...backgroundStyle,
        '--primary': pageColor,
      } as React.CSSProperties}
    >
      {activeTab === 'home' && <Header />}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${selectedProject?.id || 'none'}`}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      
      <SyncIndicator />
      <FloatingActionButton activeTab={activeTab} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}