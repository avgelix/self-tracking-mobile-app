import { projectId, publicAnonKey } from './supabase/info';
import { AppState, Project, Entry, Reminder, Widget, PendingNotification, UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-fc010b9b`;

console.log('API initialized with base URL:', API_BASE);

// Create Supabase client for auth operations
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Store access token in memory
let accessToken: string | null = null;

// Get the current access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Set the access token
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('whatever_access_token', token);
  } else {
    localStorage.removeItem('whatever_access_token');
  }
}

// Initialize auth from stored session
export async function initializeAuth(): Promise<boolean> {
  try {
    // Check for stored token
    const storedToken = localStorage.getItem('whatever_access_token');
    if (storedToken) {
      accessToken = storedToken;
      
      // Verify token is still valid
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.access_token) {
        accessToken = session.access_token;
        setAccessToken(session.access_token);
        return true;
      }
    }
    
    // Try to get existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session?.access_token) {
      accessToken = session.access_token;
      setAccessToken(session.access_token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing auth:', error);
    return false;
  }
}

// Sign up a new user
export async function signUp(email: string, password: string, name: string, surname?: string): Promise<{ success: boolean; userNumber?: number; error?: string }> {
  try {
    console.log('API: Calling signup endpoint with email:', email);
    
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, surname }),
    });

    console.log('API: Signup response status:', response.status);
    
    const data = await response.json();
    console.log('API: Signup response data:', data);
    
    if (!response.ok) {
      const errorMsg = data.error || data.details || 'Failed to sign up';
      console.error('API: Signup failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
    
    console.log('API: Account created, now signing in...');
    
    // Now sign in to get the access token
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('API: Sign in error after signup:', signInError);
      return { success: false, error: `Account created but failed to sign in: ${signInError.message}` };
    }
    
    if (!authData.session) {
      console.error('API: No session returned after sign in');
      return { success: false, error: 'Account created but no session created. Please try signing in manually.' };
    }
    
    console.log('API: Sign in successful, setting access token');
    
    accessToken = authData.session.access_token;
    setAccessToken(accessToken);
    
    console.log('API: Signup complete, user number:', data.userNumber);
    return { success: true, userNumber: data.userNumber };
  } catch (error) {
    console.error('API: Exception during signup:', error);
    return { success: false, error: String(error) };
  }
}

// Sign in an existing user
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error || !data.session) {
      return { success: false, error: error?.message || 'Failed to sign in' };
    }
    
    accessToken = data.session.access_token;
    setAccessToken(accessToken);
    
    return { success: true };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: String(error) };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    accessToken = null;
    setAccessToken(null);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Get current auth user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken || undefined);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  // For user-count endpoint, don't require auth
  const isPublicEndpoint = endpoint === '/user-count';
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken || (isPublicEndpoint ? publicAnonKey : '')}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function fetchAppState(): Promise<AppState> {
  if (!accessToken) {
    // Return empty state if not authenticated
    return {
      projects: [],
      entries: [],
      reminders: [],
      widgets: [],
      pendingNotifications: [],
      activePaths: [],
      username: undefined,
      userProfile: undefined
    };
  }
  
  try {
    const data = await makeRequest('/data');
    // Convert date strings back to Date objects
    if (data.projects) {
      data.projects = data.projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt)
      }));
    }
    if (data.entries) {
      data.entries = data.entries.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }
    if (data.reminders) {
      data.reminders = data.reminders.map((reminder: any) => ({
        ...reminder,
        startDate: new Date(reminder.startDate),
        endDate: reminder.endDate ? new Date(reminder.endDate) : undefined,
        nextDue: new Date(reminder.nextDue),
        createdAt: new Date(reminder.createdAt)
      }));
    }
    if (data.pendingNotifications) {
      data.pendingNotifications = data.pendingNotifications.map((notif: any) => ({
        ...notif,
        scheduledFor: new Date(notif.scheduledFor)
      }));
    }
    if (data.userProfile && data.userProfile.createdAt) {
      data.userProfile.createdAt = new Date(data.userProfile.createdAt);
    }
    if (data.userProfile && data.userProfile.lastLoginDate) {
      data.userProfile.lastLoginDate = new Date(data.userProfile.lastLoginDate);
    }
    return data;
  } catch (error) {
    console.error('Error fetching app state:', error);
    throw error;
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  if (!accessToken) {
    console.warn('No access token available, skipping Supabase sync');
    return;
  }
  
  try {
    await makeRequest('/data', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error('Error saving app state:', error);
    throw error;
  }
}

export async function addProject(project: Project): Promise<void> {
  try {
    await makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  try {
    await makeRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await makeRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function addEntry(entry: Entry): Promise<void> {
  try {
    await makeRequest('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await makeRequest(`/entries/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}

export async function addReminder(reminder: Reminder): Promise<void> {
  try {
    await makeRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  } catch (error) {
    console.error('Error adding reminder:', error);
    throw error;
  }
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
  try {
    await makeRequest(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
}

export async function deleteReminder(id: string): Promise<void> {
  try {
    await makeRequest(`/reminders/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
}

export async function addWidget(widget: Widget): Promise<void> {
  try {
    await makeRequest('/widgets', {
      method: 'POST',
      body: JSON.stringify(widget),
    });
  } catch (error) {
    console.error('Error adding widget:', error);
    throw error;
  }
}

export async function updateWidget(id: string, updates: Partial<Widget>): Promise<void> {
  try {
    await makeRequest(`/widgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating widget:', error);
    throw error;
  }
}

export async function deleteWidget(id: string): Promise<void> {
  try {
    await makeRequest(`/widgets/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting widget:', error);
    throw error;
  }
}

export async function addNotification(notification: PendingNotification): Promise<void> {
  try {
    await makeRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
}

export async function updateNotification(id: string, updates: Partial<PendingNotification>): Promise<void> {
  try {
    await makeRequest(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    await makeRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: { username?: string; userProfile?: UserProfile }): Promise<UserProfile | undefined> {
  try {
    const response = await makeRequest('/user-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.userProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserCount(): Promise<number> {
  try {
    const response = await makeRequest('/user-count');
    return response.count;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw error;
  }
}
