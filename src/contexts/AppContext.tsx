import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Project, Entry, AppState, Reminder, Widget, PendingNotification, UserProfile } from '../types';
import * as api from '../utils/api';

type AppAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: { id: string; updates: Partial<Reminder> } }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'ADD_WIDGET'; payload: Widget }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; updates: Partial<Widget> } }
  | { type: 'DELETE_WIDGET'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: PendingNotification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<PendingNotification> } }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'LOAD_DATA'; payload: AppState };

const initialState: AppState = {
  projects: [],
  entries: [],
  reminders: [],
  widgets: [],
  pendingNotifications: [],
  activePaths: [],
  username: undefined,
  userProfile: undefined
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload.updates } : project
        )
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        entries: state.entries.filter(entry => entry.projectId !== action.payload),
        reminders: state.reminders.filter(reminder => reminder.projectId !== action.payload),
        widgets: state.widgets.filter(widget => widget.projectId !== action.payload)
      };
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [...state.entries, action.payload]
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload)
      };
    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [...state.reminders, action.payload]
      };
    case 'UPDATE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map(reminder =>
          reminder.id === action.payload.id ? { ...reminder, ...action.payload.updates } : reminder
        )
      };
    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter(reminder => reminder.id !== action.payload),
        pendingNotifications: state.pendingNotifications.filter(notif => notif.reminderId !== action.payload)
      };
    case 'ADD_WIDGET':
      return {
        ...state,
        widgets: [...state.widgets, action.payload]
      };
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload.id ? { ...widget, ...action.payload.updates } : widget
        )
      };
    case 'DELETE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter(widget => widget.id !== action.payload)
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        pendingNotifications: [...state.pendingNotifications, action.payload]
      };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        pendingNotifications: state.pendingNotifications.map(notif =>
          notif.id === action.payload.id ? { ...notif, ...action.payload.updates } : notif
        )
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        pendingNotifications: state.pendingNotifications.filter(notif => notif.id !== action.payload)
      };
    case 'SET_USERNAME':
      return {
        ...state,
        username: action.payload
      };
    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload
      };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        userProfile: state.userProfile ? {
          ...state.userProfile,
          completedOnboarding: true
        } : undefined
      };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  isSyncing: boolean;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'nextDue'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  deleteWidget: (id: string) => void;
  scheduleNotification: (reminderId: string, scheduledFor: Date) => void;
  markNotificationDelivered: (id: string) => void;
  dismissNotification: (id: string) => void;
  setUsername: (username: string) => void;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: () => void;
  // Legacy compatibility functions
  addCategory: (category: Omit<Project, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Project>) => void;
  deleteCategory: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data from Supabase on mount, with fallback to localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== APP CONTEXT: LOADING DATA ===');
        
        // Initialize auth first
        const isAuthenticated = await api.initializeAuth();
        console.log('AppContext: Authentication status:', isAuthenticated);
        
        if (!isAuthenticated) {
          console.log('AppContext: User not authenticated, showing onboarding');
          // No auth session, user needs to go through onboarding
          setIsLoading(false);
          return;
        }
        
        console.log('AppContext: User authenticated, loading app state...');
        // Try to load from Supabase
        const data = await api.fetchAppState();
        
        // Handle legacy data - migrate categories to projects
        if ((data as any).categories && !data.projects) {
          data.projects = (data as any).categories;
          delete (data as any).categories;
        }
        
        // Handle legacy entries - migrate categoryId to projectId
        if (data.entries) {
          data.entries = data.entries.map((entry: any) => ({
            ...entry,
            projectId: entry.projectId || entry.categoryId
          }));
        }
        
        // Handle legacy reminders - migrate categoryId to projectId
        if (data.reminders) {
          data.reminders = data.reminders.map((reminder: any) => ({
            ...reminder,
            projectId: reminder.projectId || reminder.categoryId
          }));
        }
        
        // Handle legacy widgets - migrate categoryId to projectId
        if (data.widgets) {
          data.widgets = data.widgets.map((widget: any) => ({
            ...widget,
            projectId: widget.projectId || widget.categoryId
          }));
        }
        
        // Update lastLoginDate if user profile exists
        if (data.userProfile && data.userProfile.completedOnboarding) {
          data.userProfile.lastLoginDate = new Date();
          console.log('AppContext: Loaded user profile for:', data.userProfile.name, data.userProfile.email);
        } else {
          console.log('AppContext: No user profile found or onboarding not completed');
        }
        
        dispatch({ type: 'LOAD_DATA', payload: data });
        console.log('AppContext: App state loaded successfully');
      } catch (error) {
        console.error('Failed to load data from Supabase, trying localStorage:', error);
        
        // Fallback to localStorage
        const savedData = localStorage.getItem('trackingAppData');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            // Convert date strings back to Date objects
            // Handle legacy data - migrate categories to projects
            if (parsedData.categories && !parsedData.projects) {
              parsedData.projects = parsedData.categories;
              delete parsedData.categories;
            }
            
            // Handle legacy entries - migrate categoryId to projectId
            parsedData.entries = parsedData.entries.map((entry: any) => ({
              ...entry,
              projectId: entry.projectId || entry.categoryId,
              date: new Date(entry.date)
            }));
            
            // Handle legacy reminders - migrate categoryId to projectId
            if (parsedData.reminders) {
              parsedData.reminders = parsedData.reminders.map((reminder: any) => ({
                ...reminder,
                projectId: reminder.projectId || reminder.categoryId,
                startDate: new Date(reminder.startDate),
                endDate: reminder.endDate ? new Date(reminder.endDate) : undefined,
                nextDue: new Date(reminder.nextDue),
                createdAt: new Date(reminder.createdAt)
              }));
            }
            
            // Handle legacy widgets - migrate categoryId to projectId
            if (parsedData.widgets) {
              parsedData.widgets = parsedData.widgets.map((widget: any) => ({
                ...widget,
                projectId: widget.projectId || widget.categoryId
              }));
            }
            
            parsedData.projects = parsedData.projects.map((project: any) => ({
              ...project,
              createdAt: new Date(project.createdAt)
            }));
            if (parsedData.reminders) {
              parsedData.reminders = parsedData.reminders.map((reminder: any) => ({
                ...reminder,
                startDate: new Date(reminder.startDate),
                endDate: reminder.endDate ? new Date(reminder.endDate) : undefined,
                nextDue: new Date(reminder.nextDue),
                createdAt: new Date(reminder.createdAt)
              }));
            }
            if (parsedData.pendingNotifications) {
              parsedData.pendingNotifications = parsedData.pendingNotifications.map((notif: any) => ({
                ...notif,
                scheduledFor: new Date(notif.scheduledFor)
              }));
            }
            // Handle user profile dates
            if (parsedData.userProfile && parsedData.userProfile.createdAt) {
              parsedData.userProfile.createdAt = new Date(parsedData.userProfile.createdAt);
              if (parsedData.userProfile.lastLoginDate) {
                parsedData.userProfile.lastLoginDate = new Date(parsedData.userProfile.lastLoginDate);
              }
            }
            
            // Update lastLoginDate if user profile exists
            if (parsedData.userProfile && parsedData.userProfile.completedOnboarding) {
              parsedData.userProfile.lastLoginDate = new Date();
            }
            
            // Ensure all required fields exist
            const completeData = {
              projects: parsedData.projects || [],
              entries: parsedData.entries || [],
              reminders: parsedData.reminders || [],
              widgets: parsedData.widgets || [],
              pendingNotifications: parsedData.pendingNotifications || [],
              activePaths: parsedData.activePaths || [],
              username: parsedData.username,
              userProfile: parsedData.userProfile
            };
            dispatch({ type: 'LOAD_DATA', payload: completeData });
            
            // Try to sync to Supabase only if authenticated
            const accessToken = api.getAccessToken();
            if (accessToken && completeData.userProfile?.completedOnboarding) {
              try {
                await api.saveAppState(completeData);
              } catch (syncError) {
                console.error('Failed to sync localStorage data to Supabase:', syncError);
              }
            }
          } catch (error) {
            console.error('Failed to load data from localStorage:', error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save data to Supabase and localStorage whenever state changes
  useEffect(() => {
    if (isLoading) return; // Don't sync during initial load
    
    const syncData = async () => {
      if (isSyncing) return; // Prevent concurrent syncs
      
      setIsSyncing(true);
      try {
        // Save to localStorage immediately
        localStorage.setItem('trackingAppData', JSON.stringify(state));
        
        // Only save to Supabase if user is authenticated
        const accessToken = api.getAccessToken();
        if (accessToken && state.userProfile?.completedOnboarding) {
          await api.saveAppState(state);
        }
      } catch (error) {
        console.error('Failed to sync data to Supabase:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    syncData();
  }, [state, isLoading]);

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const project: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  const deleteProject = (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  };

  // Legacy compatibility functions
  const addCategory = addProject;
  const updateCategory = updateProject;
  const deleteCategory = deleteProject;

  const addEntry = (entryData: Omit<Entry, 'id'>) => {
    const entry: Entry = {
      ...entryData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  };

  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  // Helper function to calculate next due date
  const calculateNextDue = (reminder: Omit<Reminder, 'id' | 'createdAt' | 'nextDue'>): Date => {
    const now = new Date();
    const startDate = new Date(reminder.startDate);
    
    // Get times from either reminder or customFrequency
    const times = reminder.frequency === 'custom' 
      ? (reminder.customFrequency?.timesOfDay || ['09:00'])
      : (reminder.timesOfDay || ['09:00']);
    
    // Helper function to set time on a date
    const setTimeOnDate = (date: Date, timeString: string): Date => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate;
    };

    // Helper function to find next occurrence from a date considering all times
    const findNextOccurrence = (baseDate: Date): Date => {
      const candidates: Date[] = [];
      
      // Add all time slots for the base date
      times.forEach(time => {
        const candidate = setTimeOnDate(baseDate, time);
        if (candidate > now) {
          candidates.push(candidate);
        }
      });

      return candidates.length > 0 
        ? new Date(Math.min(...candidates.map(d => d.getTime())))
        : setTimeOnDate(baseDate, times[0]);
    };
    
    switch (reminder.frequency) {
      case 'once':
        return findNextOccurrence(startDate);
        
      case 'daily':
        let nextDaily = new Date(startDate);
        let foundDaily = false;
        
        // Check today first
        const todayCandidates = times.map(time => setTimeOnDate(now, time)).filter(d => d > now);
        if (todayCandidates.length > 0) {
          return new Date(Math.min(...todayCandidates.map(d => d.getTime())));
        }
        
        // Otherwise next day
        nextDaily = new Date(now);
        nextDaily.setDate(nextDaily.getDate() + 1);
        return setTimeOnDate(nextDaily, times[0]);
        
      case 'weekly':
        const selectedDays = reminder.daysOfWeek || [];
        if (selectedDays.length === 0) {
          // Fall back to weekly interval if no days selected
          let nextWeekly = new Date(startDate);
          while (nextWeekly <= now) {
            nextWeekly.setDate(nextWeekly.getDate() + 7);
          }
          return findNextOccurrence(nextWeekly);
        }
        
        // Find next occurrence on selected days
        let checkDate = new Date(now);
        for (let i = 0; i < 14; i++) { // Check next 2 weeks
          const dayOfWeek = checkDate.getDay();
          if (selectedDays.includes(dayOfWeek)) {
            const nextTime = findNextOccurrence(checkDate);
            if (nextTime > now) {
              return nextTime;
            }
          }
          checkDate.setDate(checkDate.getDate() + 1);
        }
        
        // Fallback
        return setTimeOnDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), times[0]);
        
      case 'monthly':
        let nextMonthly = new Date(startDate);
        while (nextMonthly <= now) {
          nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        }
        return findNextOccurrence(nextMonthly);
        
      case 'custom':
        if (reminder.customFrequency) {
          const { interval, unit, daysOfWeek } = reminder.customFrequency;
          
          // For custom with specific days
          if (daysOfWeek && daysOfWeek.length > 0) {
            let checkDate = new Date(now);
            for (let i = 0; i < 14; i++) {
              const dayOfWeek = checkDate.getDay();
              if (daysOfWeek.includes(dayOfWeek)) {
                const nextTime = findNextOccurrence(checkDate);
                if (nextTime > now) {
                  return nextTime;
                }
              }
              checkDate.setDate(checkDate.getDate() + 1);
            }
          }
          
          // Regular custom interval
          let nextCustom = new Date(startDate);
          while (nextCustom <= now) {
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
          }
          return findNextOccurrence(nextCustom);
        }
        return findNextOccurrence(startDate);
        
      default:
        return findNextOccurrence(startDate);
    }
  };

  const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'nextDue'>) => {
    const reminder: Reminder = {
      ...reminderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      nextDue: calculateNextDue(reminderData)
    };
    dispatch({ type: 'ADD_REMINDER', payload: reminder });
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    dispatch({ type: 'UPDATE_REMINDER', payload: { id, updates } });
  };

  const deleteReminder = (id: string) => {
    dispatch({ type: 'DELETE_REMINDER', payload: id });
  };

  const addWidget = (widgetData: Omit<Widget, 'id'>) => {
    const widget: Widget = {
      ...widgetData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_WIDGET', payload: widget });
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    dispatch({ type: 'UPDATE_WIDGET', payload: { id, updates } });
  };

  const deleteWidget = (id: string) => {
    dispatch({ type: 'DELETE_WIDGET', payload: id });
  };

  const scheduleNotification = (reminderId: string, scheduledFor: Date) => {
    const notification: PendingNotification = {
      id: Date.now().toString(),
      reminderId,
      scheduledFor,
      delivered: false,
      dismissed: false
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const markNotificationDelivered = (id: string) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, updates: { delivered: true } } });
  };

  const dismissNotification = (id: string) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, updates: { dismissed: true } } });
  };

  const setUsername = (username: string) => {
    dispatch({ type: 'SET_USERNAME', payload: username });
  };

  const setUserProfile = async (profile: UserProfile) => {
    // Update locally first
    dispatch({ type: 'SET_USER_PROFILE', payload: profile });
    
    // Then sync to server only if authenticated
    const accessToken = api.getAccessToken();
    if (accessToken) {
      try {
        const updatedProfile = await api.updateUserProfile({ userProfile: profile });
        if (updatedProfile && updatedProfile.userNumber !== profile.userNumber) {
          // Update with the user number from server
          dispatch({ type: 'SET_USER_PROFILE', payload: updatedProfile });
        }
      } catch (error) {
        console.error('Failed to sync user profile to server:', error);
      }
    }
  };

  const completeOnboarding = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  };

  return (
    <AppContext.Provider value={{
      state,
      isLoading,
      isSyncing,
      addProject,
      updateProject,
      deleteProject,
      addEntry,
      deleteEntry,
      addReminder,
      updateReminder,
      deleteReminder,
      addWidget,
      updateWidget,
      deleteWidget,
      scheduleNotification,
      markNotificationDelivered,
      dismissNotification,
      setUsername,
      setUserProfile,
      completeOnboarding,
      // Legacy compatibility functions
      addCategory,
      updateCategory,
      deleteCategory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}