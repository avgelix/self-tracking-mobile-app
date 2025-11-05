import { projectId as supabaseProjectId, publicAnonKey } from './supabase/info';
import { AppState, Project, Entry, Reminder, Widget, PendingNotification, UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

const API_BASE = `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-fc010b9b`;

console.log('API initialized with base URL:', API_BASE);

// Export projectId for use in other components
export const projectId = supabaseProjectId;

// Create Supabase client for auth operations
const supabase = createClient(
  `https://${supabaseProjectId}.supabase.co`,
  publicAnonKey
);

// Store access token in memory
let accessToken: string | null = null;

// Store user credentials for persistent login (encrypted in production)
interface StoredCredentials {
  email: string;
  password: string;
}

// Get the current access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Set the access token
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('whatever_access_token', token);
    console.log('✓ Access token stored in localStorage');
  } else {
    localStorage.removeItem('whatever_access_token');
    console.log('✗ Access token removed from localStorage');
  }
}

// Store user credentials for auto-login
function storeCredentials(email: string, password: string) {
  try {
    const credentials: StoredCredentials = { email, password };
    localStorage.setItem('whatever_credentials', JSON.stringify(credentials));
    console.log('✓ User credentials stored for auto-login');
  } catch (error) {
    console.error('Failed to store credentials:', error);
  }
}

// Get stored credentials
function getStoredCredentials(): StoredCredentials | null {
  try {
    const stored = localStorage.getItem('whatever_credentials');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to retrieve stored credentials:', error);
  }
  return null;
}

// Clear stored credentials
function clearStoredCredentials() {
  localStorage.removeItem('whatever_credentials');
  console.log('✓ User credentials cleared');
}

// Initialize auth from stored session
export async function initializeAuth(): Promise<boolean> {
  try {
    console.log('=== INITIALIZING AUTH ===');
    
    // Check for stored token
    const storedToken = localStorage.getItem('whatever_access_token');
    console.log('Stored token exists:', !!storedToken);
    
    if (storedToken) {
      console.log('Found stored token, verifying with Supabase...');
      accessToken = storedToken;
      
      // Verify token is still valid by trying to get user
      try {
        const { data: { user }, error } = await supabase.auth.getUser(storedToken);
        console.log('Token verification - User:', !!user, 'Error:', error?.message);
        
        if (user && !error) {
          console.log('✓ Token is valid, user authenticated:', user.email);
          // Token is valid, keep using it
          return true;
        } else {
          console.log('✗ Stored token is invalid or expired');
          // Token invalid, clear it
          localStorage.removeItem('whatever_access_token');
          accessToken = null;
        }
      } catch (verifyError) {
        console.error('Error verifying token:', verifyError);
      }
    }
    
    // Try to get existing session from Supabase
    console.log('Checking for Supabase session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Supabase session exists:', !!session, 'Error:', error?.message);
    
    if (session?.access_token) {
      console.log('✓ Found active Supabase session for:', session.user?.email);
      accessToken = session.access_token;
      setAccessToken(session.access_token);
      return true;
    }
    
    // Try auto-login with stored credentials as last resort
    console.log('Attempting auto-login with stored credentials...');
    const credentials = getStoredCredentials();
    if (credentials) {
      console.log('Found stored credentials for:', credentials.email);
      const result = await signIn(credentials.email, credentials.password);
      if (result.success) {
        console.log('✓ Auto-login successful');
        return true;
      } else {
        console.log('✗ Auto-login failed:', result.error);
        // Clear invalid credentials
        clearStoredCredentials();
      }
    }
    
    console.log('✗ No valid session found, user needs to sign in');
    return false;
  } catch (error) {
    console.error('Error initializing auth:', error);
    return false;
  }
}

// Sign up a new user
export async function signUp(email: string, password: string, name: string, surname?: string): Promise<{ success: boolean; userNumber?: number; error?: string }> {
  try {
    console.log('=== SIGNUP PROCESS STARTING ===');
    console.log('API: Calling signup endpoint with email:', email);
    console.log('API: Signup URL:', `${API_BASE}/signup`);
    console.log('API: Request body:', { email, password: '***', name, surname });
    
    let response;
    try {
      response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, surname }),
      });
      console.log('API: Fetch completed successfully');
    } catch (fetchError) {
      console.error('API: Fetch failed with error:', fetchError);
      console.error('API: Error type:', fetchError.constructor.name);
      console.error('API: Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      
      if (fetchError instanceof TypeError) {
        return { 
          success: false, 
          error: 'Network error: Unable to reach server. Please check your connection and try again.' 
        };
      }
      
      throw fetchError;
    }

    console.log('API: Signup response status:', response.status, response.statusText);
    console.log('API: Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Try to get response text first
    let responseText;
    try {
      responseText = await response.text();
      console.log('API: Response text length:', responseText.length);
      console.log('API: Response text:', responseText.substring(0, 500));
    } catch (textError) {
      console.error('API: Failed to read response text:', textError);
      return { 
        success: false, 
        error: 'Failed to read server response' 
      };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('API: Parsed response data:', data);
    } catch (parseError) {
      console.error('API: Failed to parse response as JSON:', parseError);
      return { 
        success: false, 
        error: `Server error: ${response.status} ${response.statusText}. Server returned: ${responseText.substring(0, 200)}` 
      };
    }
    
    if (!response.ok) {
      const errorMsg = data.error || data.details || data.message || `Server returned ${response.status}`;
      console.error('API: Signup failed with status:', response.status);
      console.error('API: Error message:', errorMsg);
      if (data.details) {
        console.error('API: Error details:', data.details);
      }
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
    
    // Store credentials for auto-login on future visits
    storeCredentials(email, password);
    
    console.log('API: Signup complete, user number:', data.userNumber);
    return { success: true, userNumber: data.userNumber };
  } catch (error) {
    console.error('API: Exception during signup:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error: Unable to connect to server. Please check your internet connection.' };
    }
    return { success: false, error: `Error: ${String(error)}` };
  }
}

// Sign in an existing user
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error || !data.session) {
      console.error('Sign in failed:', error?.message);
      return { success: false, error: error?.message || 'Failed to sign in' };
    }
    
    console.log('Sign in successful for:', data.user?.email);
    accessToken = data.session.access_token;
    setAccessToken(accessToken);
    
    // Store credentials for auto-login
    storeCredentials(email, password);
    
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
    clearStoredCredentials();
    console.log('✓ User signed out successfully');
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
