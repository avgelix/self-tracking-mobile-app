import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Check environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('=== SERVER STARTING ===');
console.log('SUPABASE_URL:', SUPABASE_URL ? `SET (${SUPABASE_URL.substring(0, 30)}...)` : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? `SET (length: ${SUPABASE_SERVICE_ROLE_KEY.length})` : 'MISSING');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const errorMsg = 'Missing required environment variables: ' + 
    (!SUPABASE_URL ? 'SUPABASE_URL ' : '') + 
    (!SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : '');
  console.error('ERROR:', errorMsg);
  throw new Error(errorMsg);
}

console.log('Environment variables confirmed, creating Supabase client...');

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

console.log('Supabase client created successfully');
console.log('=== SERVER INITIALIZATION COMPLETE ===');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get user ID from authorization header
async function getUserIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  // Don't try to validate if it's the public anon key
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error('Auth error:', error?.message || 'No user found');
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// Handle OPTIONS requests explicitly
app.options("/make-server-fc010b9b/*", (c) => {
  return c.text("", 204);
});

// Health check endpoint
app.get("/make-server-fc010b9b/health", async (c) => {
  console.log('Health check endpoint called');
  
  // Test if we can access environment variables
  const hasUrl = !!Deno.env.get('SUPABASE_URL');
  const hasKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('Environment check - URL:', hasUrl, 'KEY:', hasKey);
  
  // Test if KV store is accessible
  let kvWorking = false;
  try {
    await kv.get('_health_check_test');
    kvWorking = true;
    console.log('KV store is accessible');
  } catch (kvError) {
    console.error('KV store error:', kvError);
  }
  
  // If this endpoint responds, the server is running
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    serverRunning: true,
    environmentVariables: { hasUrl, hasKey },
    kvStoreWorking: kvWorking
  });
});

// Get total user count endpoint (public - no auth required beyond anon key)
app.get("/make-server-fc010b9b/user-count", async (c) => {
  try {
    console.log('Server: Getting user count...');
    const count = await kv.get('totalUserCount') || 0;
    console.log('Server: Current user count:', count);
    return c.json({ count });
  } catch (error) {
    console.error('Server: Error getting user count:', error);
    return c.json({ error: 'Failed to get user count', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Sign up endpoint - creates a new user account
app.post("/make-server-fc010b9b/signup", async (c) => {
  try {
    console.log('Server: Signup endpoint called');
    
    const body = await c.req.json();
    const { email, password, name, surname } = body;
    
    console.log('Server: Signup request for email:', email, 'name:', name);
    
    if (!email || !password || !name) {
      console.error('Server: Missing required fields');
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    console.log('Server: Validating supabaseAdmin client...');
    if (!supabaseAdmin) {
      console.error('Server: supabaseAdmin client is not initialized!');
      return c.json({ error: 'Server configuration error - Supabase client not initialized' }, 500);
    }
    
    console.log('Server: Creating user with Supabase Auth...');
    console.log('Server: Using auth endpoint:', supabaseAdmin.auth ? 'Available' : 'NOT AVAILABLE');
    
    // Create user with Supabase Auth
    let data, error;
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, surname },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true
      });
      data = result.data;
      error = result.error;
      
      console.log('Server: createUser call completed');
      console.log('Server: Has data:', !!data);
      console.log('Server: Has error:', !!error);
    } catch (createUserException) {
      console.error('Server: Exception during createUser:', createUserException);
      return c.json({ 
        error: 'Failed to create user', 
        details: createUserException instanceof Error ? createUserException.message : String(createUserException)
      }, 500);
    }
    
    if (error) {
      console.error('Server: Supabase Auth error:', error);
      return c.json({ error: 'Failed to create user account', details: error.message }, 400);
    }
    
    if (!data.user) {
      console.error('Server: No user returned from Supabase');
      return c.json({ error: 'Failed to create user account', details: 'No user data returned' }, 400);
    }
    
    console.log('Server: User created successfully:', data.user.id);
    
    // Get the current total user count
    console.log('Server: Getting user count...');
    const userCount = await kv.get('totalUserCount') || 0;
    const newUserNumber = userCount + 1;
    
    console.log('Server: Current user count:', userCount, 'New user number:', newUserNumber);
    
    // Update the total user count
    await kv.set('totalUserCount', newUserNumber);
    
    console.log('Server: Signup complete, returning success');
    
    return c.json({ 
      success: true, 
      user: data.user,
      userNumber: newUserNumber
    });
  } catch (error) {
    console.error('Server: Signup exception:', error);
    return c.json({ error: 'Failed to create account', details: String(error) }, 500);
  }
});

// Get all app data for the authenticated user
app.get("/make-server-fc010b9b/data", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      // Return initial state if no data exists
      return c.json({
        projects: [],
        entries: [],
        reminders: [],
        widgets: [],
        pendingNotifications: [],
        activePaths: [],
        username: undefined,
        userProfile: undefined
      });
    }
    return c.json(appState);
  } catch (error) {
    console.error('Error fetching app data:', error);
    return c.json({ error: 'Failed to fetch data', details: String(error) }, 500);
  }
});

// Save all app data for the authenticated user
app.post("/make-server-fc010b9b/data", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const data = await c.req.json();
    await kv.set(`appState:${userId}`, data);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving app data:', error);
    return c.json({ error: 'Failed to save data', details: String(error) }, 500);
  }
});

// Project routes
app.post("/make-server-fc010b9b/projects", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const project = await c.req.json();
    const appState = await kv.get(`appState:${userId}`) || {
      projects: [],
      entries: [],
      reminders: [],
      widgets: [],
      pendingNotifications: [],
      activePaths: []
    };
    appState.projects.push(project);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, project });
  } catch (error) {
    console.error('Error adding project:', error);
    return c.json({ error: 'Failed to add project', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const projectIndex = appState.projects.findIndex((p: any) => p.id === id);
    if (projectIndex === -1) {
      return c.json({ error: 'Project not found' }, 404);
    }
    appState.projects[projectIndex] = { ...appState.projects[projectIndex], ...updates };
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, project: appState.projects[projectIndex] });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.projects = appState.projects.filter((p: any) => p.id !== id);
    appState.entries = appState.entries.filter((e: any) => e.projectId !== id);
    appState.reminders = appState.reminders.filter((r: any) => r.projectId !== id);
    appState.widgets = appState.widgets.filter((w: any) => w.projectId !== id);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project', details: String(error) }, 500);
  }
});

// Entry routes
app.post("/make-server-fc010b9b/entries", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const entry = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.entries.push(entry);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, entry });
  } catch (error) {
    console.error('Error adding entry:', error);
    return c.json({ error: 'Failed to add entry', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/entries/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.entries = appState.entries.filter((e: any) => e.id !== id);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ error: 'Failed to delete entry', details: String(error) }, 500);
  }
});

// Reminder routes
app.post("/make-server-fc010b9b/reminders", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const reminder = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.reminders.push(reminder);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, reminder });
  } catch (error) {
    console.error('Error adding reminder:', error);
    return c.json({ error: 'Failed to add reminder', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/reminders/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const reminderIndex = appState.reminders.findIndex((r: any) => r.id === id);
    if (reminderIndex === -1) {
      return c.json({ error: 'Reminder not found' }, 404);
    }
    appState.reminders[reminderIndex] = { ...appState.reminders[reminderIndex], ...updates };
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, reminder: appState.reminders[reminderIndex] });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return c.json({ error: 'Failed to update reminder', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/reminders/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.reminders = appState.reminders.filter((r: any) => r.id !== id);
    appState.pendingNotifications = appState.pendingNotifications.filter((n: any) => n.reminderId !== id);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return c.json({ error: 'Failed to delete reminder', details: String(error) }, 500);
  }
});

// Widget routes
app.post("/make-server-fc010b9b/widgets", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const widget = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.widgets.push(widget);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, widget });
  } catch (error) {
    console.error('Error adding widget:', error);
    return c.json({ error: 'Failed to add widget', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/widgets/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const widgetIndex = appState.widgets.findIndex((w: any) => w.id === id);
    if (widgetIndex === -1) {
      return c.json({ error: 'Widget not found' }, 404);
    }
    appState.widgets[widgetIndex] = { ...appState.widgets[widgetIndex], ...updates };
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, widget: appState.widgets[widgetIndex] });
  } catch (error) {
    console.error('Error updating widget:', error);
    return c.json({ error: 'Failed to update widget', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/widgets/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.widgets = appState.widgets.filter((w: any) => w.id !== id);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return c.json({ error: 'Failed to delete widget', details: String(error) }, 500);
  }
});

// Notification routes
app.post("/make-server-fc010b9b/notifications", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const notification = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.pendingNotifications.push(notification);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, notification });
  } catch (error) {
    console.error('Error adding notification:', error);
    return c.json({ error: 'Failed to add notification', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/notifications/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const notificationIndex = appState.pendingNotifications.findIndex((n: any) => n.id === id);
    if (notificationIndex === -1) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    appState.pendingNotifications[notificationIndex] = { ...appState.pendingNotifications[notificationIndex], ...updates };
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, notification: appState.pendingNotifications[notificationIndex] });
  } catch (error) {
    console.error('Error updating notification:', error);
    return c.json({ error: 'Failed to update notification', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/notifications/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const appState = await kv.get(`appState:${userId}`);
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.pendingNotifications = appState.pendingNotifications.filter((n: any) => n.id !== id);
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification', details: String(error) }, 500);
  }
});

// User profile routes
app.put("/make-server-fc010b9b/user-profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const updates = await c.req.json();
    const appState = await kv.get(`appState:${userId}`) || {
      projects: [],
      entries: [],
      reminders: [],
      widgets: [],
      pendingNotifications: [],
      activePaths: []
    };
    
    appState.userProfile = updates.userProfile;
    appState.username = updates.username;
    await kv.set(`appState:${userId}`, appState);
    return c.json({ success: true, userProfile: appState.userProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update user profile', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
