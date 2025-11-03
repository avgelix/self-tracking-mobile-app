import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

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

// Health check endpoint
app.get("/make-server-fc010b9b/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all app data
app.get("/make-server-fc010b9b/data", async (c) => {
  try {
    const appState = await kv.get('appState');
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

// Save all app data
app.post("/make-server-fc010b9b/data", async (c) => {
  try {
    const data = await c.req.json();
    await kv.set('appState', data);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving app data:', error);
    return c.json({ error: 'Failed to save data', details: String(error) }, 500);
  }
});

// Project routes
app.post("/make-server-fc010b9b/projects", async (c) => {
  try {
    const project = await c.req.json();
    const appState = await kv.get('appState') || {
      projects: [],
      entries: [],
      reminders: [],
      widgets: [],
      pendingNotifications: [],
      activePaths: []
    };
    appState.projects.push(project);
    await kv.set('appState', appState);
    return c.json({ success: true, project });
  } catch (error) {
    console.error('Error adding project:', error);
    return c.json({ error: 'Failed to add project', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/projects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const projectIndex = appState.projects.findIndex((p: any) => p.id === id);
    if (projectIndex === -1) {
      return c.json({ error: 'Project not found' }, 404);
    }
    appState.projects[projectIndex] = { ...appState.projects[projectIndex], ...updates };
    await kv.set('appState', appState);
    return c.json({ success: true, project: appState.projects[projectIndex] });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/projects/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.projects = appState.projects.filter((p: any) => p.id !== id);
    appState.entries = appState.entries.filter((e: any) => e.projectId !== id);
    appState.reminders = appState.reminders.filter((r: any) => r.projectId !== id);
    appState.widgets = appState.widgets.filter((w: any) => w.projectId !== id);
    await kv.set('appState', appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project', details: String(error) }, 500);
  }
});

// Entry routes
app.post("/make-server-fc010b9b/entries", async (c) => {
  try {
    const entry = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.entries.push(entry);
    await kv.set('appState', appState);
    return c.json({ success: true, entry });
  } catch (error) {
    console.error('Error adding entry:', error);
    return c.json({ error: 'Failed to add entry', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/entries/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.entries = appState.entries.filter((e: any) => e.id !== id);
    await kv.set('appState', appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ error: 'Failed to delete entry', details: String(error) }, 500);
  }
});

// Reminder routes
app.post("/make-server-fc010b9b/reminders", async (c) => {
  try {
    const reminder = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.reminders.push(reminder);
    await kv.set('appState', appState);
    return c.json({ success: true, reminder });
  } catch (error) {
    console.error('Error adding reminder:', error);
    return c.json({ error: 'Failed to add reminder', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/reminders/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const reminderIndex = appState.reminders.findIndex((r: any) => r.id === id);
    if (reminderIndex === -1) {
      return c.json({ error: 'Reminder not found' }, 404);
    }
    appState.reminders[reminderIndex] = { ...appState.reminders[reminderIndex], ...updates };
    await kv.set('appState', appState);
    return c.json({ success: true, reminder: appState.reminders[reminderIndex] });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return c.json({ error: 'Failed to update reminder', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/reminders/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.reminders = appState.reminders.filter((r: any) => r.id !== id);
    appState.pendingNotifications = appState.pendingNotifications.filter((n: any) => n.reminderId !== id);
    await kv.set('appState', appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return c.json({ error: 'Failed to delete reminder', details: String(error) }, 500);
  }
});

// Widget routes
app.post("/make-server-fc010b9b/widgets", async (c) => {
  try {
    const widget = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.widgets.push(widget);
    await kv.set('appState', appState);
    return c.json({ success: true, widget });
  } catch (error) {
    console.error('Error adding widget:', error);
    return c.json({ error: 'Failed to add widget', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/widgets/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const widgetIndex = appState.widgets.findIndex((w: any) => w.id === id);
    if (widgetIndex === -1) {
      return c.json({ error: 'Widget not found' }, 404);
    }
    appState.widgets[widgetIndex] = { ...appState.widgets[widgetIndex], ...updates };
    await kv.set('appState', appState);
    return c.json({ success: true, widget: appState.widgets[widgetIndex] });
  } catch (error) {
    console.error('Error updating widget:', error);
    return c.json({ error: 'Failed to update widget', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/widgets/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.widgets = appState.widgets.filter((w: any) => w.id !== id);
    await kv.set('appState', appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return c.json({ error: 'Failed to delete widget', details: String(error) }, 500);
  }
});

// Notification routes
app.post("/make-server-fc010b9b/notifications", async (c) => {
  try {
    const notification = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.pendingNotifications.push(notification);
    await kv.set('appState', appState);
    return c.json({ success: true, notification });
  } catch (error) {
    console.error('Error adding notification:', error);
    return c.json({ error: 'Failed to add notification', details: String(error) }, 500);
  }
});

app.put("/make-server-fc010b9b/notifications/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    const notificationIndex = appState.pendingNotifications.findIndex((n: any) => n.id === id);
    if (notificationIndex === -1) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    appState.pendingNotifications[notificationIndex] = { ...appState.pendingNotifications[notificationIndex], ...updates };
    await kv.set('appState', appState);
    return c.json({ success: true, notification: appState.pendingNotifications[notificationIndex] });
  } catch (error) {
    console.error('Error updating notification:', error);
    return c.json({ error: 'Failed to update notification', details: String(error) }, 500);
  }
});

app.delete("/make-server-fc010b9b/notifications/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    appState.pendingNotifications = appState.pendingNotifications.filter((n: any) => n.id !== id);
    await kv.set('appState', appState);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification', details: String(error) }, 500);
  }
});

// User profile routes
app.put("/make-server-fc010b9b/user-profile", async (c) => {
  try {
    const updates = await c.req.json();
    const appState = await kv.get('appState');
    if (!appState) {
      return c.json({ error: 'No data found' }, 404);
    }
    
    // If this is a new user completing onboarding and doesn't have a user number yet
    if (updates.userProfile && !updates.userProfile.userNumber) {
      // Get the current total user count
      const userCount = await kv.get('totalUserCount') || 0;
      const newUserNumber = userCount + 1;
      
      // Assign the user number
      updates.userProfile.userNumber = newUserNumber;
      
      // Update the total user count
      await kv.set('totalUserCount', newUserNumber);
    }
    
    appState.userProfile = updates.userProfile;
    appState.username = updates.username;
    await kv.set('appState', appState);
    return c.json({ success: true, userProfile: appState.userProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update user profile', details: String(error) }, 500);
  }
});

// Get total user count
app.get("/make-server-fc010b9b/user-count", async (c) => {
  try {
    const userCount = await kv.get('totalUserCount') || 0;
    return c.json({ count: userCount });
  } catch (error) {
    console.error('Error getting user count:', error);
    return c.json({ error: 'Failed to get user count', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
