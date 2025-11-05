# Data Persistence Guide

## Quick Answer: YES! ✅

**All user data IS persisted to the database and syncs automatically.**

Your projects, entries, reminders, widgets, and all other data are saved in:
1. **Supabase KV Store** (database) - Primary source of truth
2. **localStorage** (browser) - For offline access and quick loading

---

## What Gets Saved

### Everything in AppState:

```typescript
{
  projects: Project[],           // ✅ All your tracking projects
  entries: Entry[],              // ✅ All logged data entries
  reminders: Reminder[],         // ✅ Reminder configurations
  widgets: Widget[],             // ✅ Home screen widget settings
  pendingNotifications: [],      // ✅ Scheduled notifications
  activePaths: PathData[],       // ✅ GPS path recording data
  userProfile: UserProfile       // ✅ Your profile & settings
}
```

### Detailed Breakdown:

#### 1. Projects (Your Tracking Categories)
```typescript
{
  id: "1234567890",
  name: "Daily Mood",
  color: "#6366f1",
  icon: "smile",
  description: "Track my daily mood",
  fields: [
    {
      id: "field1",
      name: "Mood",
      type: "scale",
      min: 1,
      max: 10,
      subfields: [...]  // Unlimited nesting!
    }
  ],
  createdAt: "2025-11-05T10:00:00Z"
}
```

#### 2. Entries (Your Logged Data)
```typescript
{
  id: "entry123",
  projectId: "1234567890",
  date: "2025-11-05T14:30:00Z",
  values: [
    {
      fieldId: "field1",
      value: 8,
      subvalues: [...]  // Nested data
    }
  ],
  note: "Had a great day!"
}
```

#### 3. Reminders
```typescript
{
  id: "reminder1",
  projectId: "1234567890",
  name: "Evening Check-in",
  frequency: "daily",
  time: "20:00",
  enabled: true,
  // ... notification settings
}
```

#### 4. Widgets
```typescript
{
  id: "widget1",
  projectId: "1234567890",
  fieldId: "field1",
  type: "tally",
  size: "small",
  position: 0
}
```

#### 5. User Profile
```typescript
{
  name: "John",
  surname: "Doe",
  email: "john@example.com",
  userNumber: 1,
  completedOnboarding: true,
  createdAt: "2025-11-05T10:00:00Z",
  lastLoginDate: "2025-11-05T14:00:00Z"
}
```

---

## How Data Syncing Works

### Two-Layer Persistence System

#### Layer 1: localStorage (Browser)
- **Purpose**: Instant access, offline capability
- **Location**: Browser storage on your device
- **Persists**: Until you clear browser data
- **Sync**: Immediate on every change

#### Layer 2: Supabase KV Store (Database)
- **Purpose**: Cross-device sync, backup, permanent storage
- **Location**: Cloud database
- **Persists**: Forever (until you delete it)
- **Sync**: Every time state changes

### Automatic Sync Process

```typescript
// In AppContext.tsx - runs on EVERY state change
useEffect(() => {
  // 1. Save to localStorage (instant)
  localStorage.setItem('trackingAppData', JSON.stringify(state));
  
  // 2. Save to Supabase (if authenticated)
  if (accessToken && state.userProfile?.completedOnboarding) {
    await api.saveAppState(state);  // ← Syncs to database
  }
}, [state]);
```

**This means**:
- ✅ Create a project → Saved immediately to both
- ✅ Log an entry → Saved immediately to both
- ✅ Update a reminder → Saved immediately to both
- ✅ Delete data → Deleted from both

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTION                          │
│           (Create project, log entry, etc.)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   AppContext Dispatch                       │
│            dispatch({ type: 'ADD_PROJECT', ... })           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Updated (in memory)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   useEffect Triggered                       │
│                  (state changed detected)                   │
└───────────┬──────────────────────────┬──────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│   localStorage      │    │    Supabase KV Store            │
│   (Browser)         │    │    (Cloud Database)             │
│                     │    │                                 │
│ Saves instantly     │    │ POST /data                      │
│ for offline access  │    │ Key: appState:{userId}          │
│                     │    │ Value: entire AppState          │
└─────────────────────┘    └─────────────────────────────────┘
```

---

## Database Structure

### Storage Location

All your data is stored in the **Supabase KV Store** with this key:

```
appState:{userId}
```

Where `{userId}` is your unique Supabase Auth user ID (a UUID).

### Example:
```
Key: appState:a1b2c3d4-e5f6-7890-abcd-ef1234567890
Value: {
  projects: [...],
  entries: [...],
  reminders: [...],
  widgets: [...],
  // ... entire AppState
}
```

### Data Retrieval

When you open the app:

1. **Authentication check** (`initializeAuth()`)
   - Verifies you're logged in
   - Gets your `userId`

2. **Data fetch** (`fetchAppState()`)
   ```typescript
   // GET /data endpoint
   const appState = await kv.get(`appState:${userId}`);
   return appState;
   ```

3. **State hydration**
   - Loads data into AppContext
   - Converts date strings to Date objects
   - You see all your projects and entries!

---

## Server Endpoints

### 1. GET /data - Fetch all user data
```typescript
app.get("/make-server-fc010b9b/data", async (c) => {
  const userId = await getUserIdFromAuth(authHeader);
  const appState = await kv.get(`appState:${userId}`);
  return c.json(appState);
});
```

### 2. POST /data - Save all user data
```typescript
app.post("/make-server-fc010b9b/data", async (c) => {
  const userId = await getUserIdFromAuth(authHeader);
  const data = await c.req.json();
  await kv.set(`appState:${userId}`, data);
  return c.json({ success: true });
});
```

### 3. Additional endpoints for individual operations:
- `POST /projects` - Add a single project
- `PUT /projects/:id` - Update a project
- `DELETE /projects/:id` - Delete a project
- `POST /entries` - Add a single entry
- `PUT /entries/:id` - Update an entry
- `DELETE /entries/:id` - Delete an entry

**Note**: The individual endpoints are available but the app primarily uses the bulk `POST /data` endpoint for simplicity.

---

## Data Persistence Across Devices

### Same Device, Different Sessions
✅ **Works perfectly**
- Data loads from Supabase on each login
- localStorage provides instant loading

### Different Devices
✅ **Works perfectly** (as long as you log in with same account)
- Sign in on Device A → Data synced to Supabase
- Sign in on Device B with same credentials → Data loads from Supabase
- All your projects and entries appear!

### Example Scenario:
```
1. Create project on your laptop
   → Saved to Supabase

2. Open app on your phone
   → Log in with same email/password
   → Data loads from Supabase
   → See the same project!

3. Log entry on your phone
   → Saved to Supabase

4. Return to laptop
   → Refresh the page
   → New entry appears!
```

---

## Data Backup & Export

### Automatic Backup
Your data is automatically backed up to Supabase every time you make a change.

### Manual Export
Go to **Settings → Data → Export Data**

Export formats:
- **CSV** - Spreadsheet-friendly format
- **PDF** - Printable document
- **JSON** - Complete raw data backup

### Manual Import
Currently, there's no import feature, but you can:
1. Export your data as JSON
2. If needed, manually edit the JSON
3. Paste it back into `localStorage` or restore via server

---

## Testing Data Persistence

### Test 1: Basic Persistence
1. Create a project
2. Log an entry
3. **Refresh the page**
4. ✅ Project and entry should still be there

### Test 2: Cross-Session Persistence
1. Create a project
2. Close the browser completely
3. Reopen the app
4. ✅ Project should still be there (if you're logged in)

### Test 3: Cross-Device Persistence
1. Create a project on Device A
2. Log in on Device B with same credentials
3. ✅ Project should appear on Device B

### Test 4: Data Sync
1. Open browser console (F12)
2. Watch the Network tab
3. Create a project
4. ✅ Should see a POST request to `/make-server-fc010b9b/data`

### Test 5: Verify Database Storage
1. Open browser console
2. Run:
   ```javascript
   fetch(`https://YOUR_PROJECT.supabase.co/functions/v1/make-server-fc010b9b/data`, {
     headers: { 
       'Authorization': `Bearer ${localStorage.getItem('whatever_access_token')}`
     }
   })
   .then(r => r.json())
   .then(d => console.log('Database data:', d));
   ```
3. ✅ Should see all your projects and entries

---

## Common Issues & Solutions

### Issue 1: Data Not Persisting
**Symptoms**: Create data, refresh, it's gone

**Possible Causes**:
- Not authenticated (no access token)
- Onboarding not completed
- Network error preventing sync

**Debug**:
```javascript
// Check auth status
console.log('Token:', localStorage.getItem('whatever_access_token'));
console.log('Onboarding:', JSON.parse(localStorage.getItem('trackingAppData'))?.userProfile?.completedOnboarding);

// Check if data is in localStorage
console.log('Local data:', JSON.parse(localStorage.getItem('trackingAppData')));
```

**Solution**:
1. Go to Settings → Data → Authentication Debug
2. Verify all items have green checkmarks
3. If not, complete onboarding again

### Issue 2: Data on Device A Not on Device B
**Symptoms**: Different data on different devices

**Cause**: Logged in with different accounts OR not logged in

**Solution**:
1. Verify you're using the **same email** on both devices
2. Check Settings → User Profile shows same email
3. Log out and log back in to force a fresh data load

### Issue 3: Sync Indicator Always Showing
**Symptoms**: "Syncing..." never completes

**Cause**: Network error or server issue

**Solution**:
1. Check browser console for errors
2. Check network connection
3. Try refreshing the page
4. If persists, check Supabase dashboard for server status

---

## Data Size Limits

### Supabase KV Store
- **Single value limit**: ~1MB (practical limit)
- **Total storage**: Depends on your Supabase plan
- **Free tier**: Generous enough for most prototyping

### localStorage
- **Browser limit**: 5-10 MB (varies by browser)
- **Per domain**: Shared across all localStorage keys

### Recommendations
- For **typical use** (dozens of projects, hundreds of entries): ✅ No problem
- For **heavy use** (thousands of entries): ⚠️ May need optimization
- For **very heavy use**: Consider:
  - Archiving old entries
  - Paginating data loads
  - Moving to a proper database table (not KV store)

---

## Security & Privacy

### Data Encryption
- **In transit**: ✅ HTTPS encrypted
- **At rest**: ✅ Supabase encrypts database storage
- **Access control**: ✅ User ID-based isolation

### Who Can Access Your Data?
- ✅ **You** - With your login credentials
- ✅ **Supabase admins** - Have database access (but shouldn't look)
- ❌ **Other users** - Cannot access (isolated by userId)
- ❌ **Public** - Not exposed

### Data Isolation
Each user's data is completely isolated:
```
User A: appState:user-a-uuid-1234
User B: appState:user-b-uuid-5678
```

They can never access each other's data.

---

## Future Enhancements (Optional)

### 1. Real-Time Sync
Currently: Syncs on page load and after changes
Future: Live updates across devices

### 2. Conflict Resolution
Currently: Last write wins
Future: Merge conflicts intelligently

### 3. Offline Mode
Currently: localStorage provides basic offline access
Future: Full offline mode with sync queue

### 4. Selective Sync
Currently: Syncs everything
Future: Sync only changed items

### 5. Data Versioning
Currently: No version history
Future: Track changes, restore previous versions

---

## Summary

### ✅ What's Working Now:
- All data saved to Supabase KV Store
- Automatic sync on every change
- localStorage backup for instant access
- Cross-device sync when logged in
- Data isolation per user
- Export to CSV/PDF/JSON

### 🎯 Key Points:
1. **Every change is saved** to both localStorage AND Supabase
2. **Data persists** across sessions, refreshes, and devices
3. **Requires authentication** - must be logged in to sync to database
4. **Automatic** - no manual save button needed
5. **Secure** - isolated per user, encrypted in transit

### 📊 Testing:
To verify it's working:
1. Create a project
2. Check browser console for sync logs
3. Check Network tab for POST to `/data`
4. Refresh page → data should persist
5. Check Settings → Data → Auth Debug for status

---

## Questions?

If you're unsure whether your data is persisting:
1. Go to Settings → Data
2. Click "Copy Debug Info"
3. Check the output for:
   - Access Token: Present ✅
   - User Profile: Loaded ✅
   - Onboarding: Complete ✅
4. Check browser console for sync errors
5. Test by creating data and refreshing

**Your data is safe and persisted! 🎉**
