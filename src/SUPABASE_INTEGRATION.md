# Supabase Integration

This document explains how the Whatever app is integrated with Supabase for data persistence.

## Architecture

The app uses a three-tier architecture:
- **Frontend**: React components using the AppContext for state management
- **Server**: Supabase Edge Function running a Hono web server
- **Database**: Supabase KV store for data persistence

## Data Flow

1. **Initial Load**: On app startup, data is fetched from Supabase
2. **Fallback**: If Supabase is unavailable, data is loaded from localStorage
3. **Sync**: All state changes are automatically synced to both Supabase and localStorage
4. **Real-time**: Changes are persisted immediately after each action

## Server Endpoints

The server provides RESTful endpoints at:
`https://${projectId}.supabase.co/functions/v1/make-server-fc010b9b`

### Available Routes

- `GET /health` - Health check
- `GET /data` - Fetch all app state
- `POST /data` - Save entire app state

#### Projects
- `POST /projects` - Create a new project
- `PUT /projects/:id` - Update a project
- `DELETE /projects/:id` - Delete a project

#### Entries
- `POST /entries` - Create a new entry
- `DELETE /entries/:id` - Delete an entry

#### Reminders
- `POST /reminders` - Create a new reminder
- `PUT /reminders/:id` - Update a reminder
- `DELETE /reminders/:id` - Delete a reminder

#### Widgets
- `POST /widgets` - Create a new widget
- `PUT /widgets/:id` - Update a widget
- `DELETE /widgets/:id` - Delete a widget

#### Notifications
- `POST /notifications` - Create a new notification
- `PUT /notifications/:id` - Update a notification
- `DELETE /notifications/:id` - Delete a notification

#### User Profile
- `PUT /user-profile` - Update user profile and username

## Data Storage

All data is stored in the Supabase KV store under the key `appState`. The data structure includes:

```typescript
{
  projects: Project[],
  entries: Entry[],
  reminders: Reminder[],
  widgets: Widget[],
  pendingNotifications: PendingNotification[],
  activePaths: PathData[],
  username?: string,
  userProfile?: UserProfile
}
```

## Features

### Automatic Syncing
- All changes are automatically synced to Supabase in the background
- A sync indicator appears in the top-right corner during sync operations
- Data is also saved to localStorage as a backup

### Offline Support
- The app works offline using localStorage
- Changes made offline will sync to Supabase when connectivity is restored

### Loading States
- A loading screen appears while initial data is being fetched
- Sync indicator shows when data is being saved

## Authentication

Currently, the app uses the public anonymous key for authentication. All users share the same data store. For multi-user support, authentication would need to be implemented using Supabase Auth.

## Error Handling

- If Supabase is unavailable during initial load, the app falls back to localStorage
- If sync fails, changes are still saved to localStorage
- All errors are logged to the console for debugging

## Files

- `/supabase/functions/server/index.tsx` - Server implementation
- `/utils/api.ts` - API client for making requests to the server
- `/contexts/AppContext.tsx` - State management with Supabase integration
- `/components/SyncIndicator.tsx` - Visual indicator for sync status
