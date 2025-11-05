# Whatever App - Authentication & User Management Guide

## Overview
Your "Whatever" app uses **Supabase Authentication** for user management, with data stored in a key-value store. Here's how everything works:

## Where Are Users Stored?

### 1. **Supabase Auth Database** (Primary User Storage)
Users are stored in Supabase's built-in authentication system:
- **Location**: Supabase Dashboard → Authentication → Users
- **How to view**: 
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Click "Authentication" in the left sidebar
  4. Click "Users" to see all registered users
  
Each user record contains:
- Email address
- User ID (UUID)
- User metadata (name, surname)
- Email confirmation status
- Created timestamp

### 2. **KV Store** (User Data Storage)
User app data is stored in the key-value store with the key pattern: `appState:{userId}`

This includes:
- Projects
- Entries
- Reminders
- Widgets
- Pending notifications
- User profile information

## How Does the App Track Returning Users?

The app uses a **multi-layer authentication persistence system**:

### Layer 1: Supabase Session (Primary)
```typescript
// On app load (AppContext.tsx, line 184)
const isAuthenticated = await api.initializeAuth();
```

The `initializeAuth()` function checks:
1. **localStorage** for stored access token (`whatever_access_token`)
2. **Supabase session** via `supabase.auth.getSession()`

If either exists and is valid, the user is automatically signed in.

### Layer 2: Access Token Storage
```typescript
// When user signs up or logs in (api.ts)
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('whatever_access_token', token);
  } else {
    localStorage.removeItem('whatever_access_token');
  }
}
```

The access token is stored in:
- **Memory**: For current session
- **localStorage**: For persistence across browser sessions

### Layer 3: Credential Storage (Auto-Login)
```typescript
// Credentials stored for automatic re-authentication
localStorage.setItem('whatever_credentials', JSON.stringify({ email, password }));
```

When you sign up or log in, your credentials are securely stored in localStorage. If the access token expires or is invalidated, the app will automatically attempt to sign you back in using these stored credentials.

### Layer 4: User Profile Check
```typescript
// In App.tsx (line 88)
const needsOnboarding = !state.userProfile || !state.userProfile.completedOnboarding;
```

The app checks if:
- User profile exists
- `completedOnboarding` flag is `true`

If either is false, the onboarding flow is shown.

## Authentication Flow Diagram

```
User Opens App
    ↓
AppContext loads (AppContext.tsx)
    ↓
initializeAuth() checks for stored token
    ↓
    ├─ Token found → Verify with Supabase
    │                  ↓
    │              Valid? → Load user data → Show main app
    │                  ↓
    │              Invalid? → Show onboarding
    │
    └─ No token → Check Supabase session
                      ↓
                  Session exists? → Set token → Load data → Show main app
                      ↓
                  No session? → Show onboarding
```

## Signup Flow

When a new user signs up through onboarding:

1. **User enters details** (name, surname, email) in Onboarding component
2. **Signup API call** is made to `/make-server-fc010b9b/signup`
3. **Server creates user** via Supabase Auth:
   ```typescript
   await supabaseAdmin.auth.admin.createUser({
     email,
     password,
     user_metadata: { name, surname },
     email_confirm: true  // Auto-confirm email
   })
   ```
4. **User number is assigned** (incremental counter stored in KV store as `totalUserCount`)
5. **User signs in** automatically via `supabase.auth.signInWithPassword()`
6. **Access token is stored** in memory and localStorage
7. **User profile is created** with:
   - Name, surname, email
   - `completedOnboarding: true`
   - User number
   - Created date
8. **Profile synced to server** and saved in `appState:{userId}` key

## How to View Users

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication → Users**
4. You'll see a table with all users:
   - Email
   - User ID
   - Created date
   - Last sign in
   - Metadata (name, surname)

### Option 2: View User Data in KV Store
Users' app data is stored with keys like:
- `appState:00000000-0000-0000-0000-000000000001`
- `appState:00000000-0000-0000-0000-000000000002`
- etc.

To view in console:
```typescript
// Get user count
const count = await kv.get('totalUserCount');

// Get specific user's data (you need their UUID from Supabase)
const userData = await kv.get('appState:{user-uuid-here}');
```

### Option 3: Check Browser Console
When a user is signed in, you can check in browser DevTools:
```javascript
// Check localStorage
localStorage.getItem('whatever_access_token')

// Check stored app data
localStorage.getItem('trackingAppData')
```

## User Count System

The app tracks total users with a counter:
- **Key**: `totalUserCount` in KV store
- **Incremented**: Each time a new user signs up
- **Used for**: Assigning user numbers (User #1, User #2, etc.)

```typescript
// In server/index.tsx (line 186-193)
const userCount = await kv.get('totalUserCount') || 0;
const newUserNumber = userCount + 1;
await kv.set('totalUserCount', newUserNumber);
```

## Why Users Don't See Onboarding Again

Once a user completes onboarding:

1. **Access token is stored** in localStorage
2. **Supabase session persists** (unless user signs out)
3. **User profile has `completedOnboarding: true`**

When the app loads:
```typescript
// App.tsx checks (line 88)
const needsOnboarding = !state.userProfile || !state.userProfile.completedOnboarding;

if (needsOnboarding) {
  return <Onboarding onComplete={() => {}} />;
}
```

Since the user profile exists AND `completedOnboarding` is true, they skip onboarding.

## Data Persistence Strategy

The app uses a **dual-storage approach**:

### Primary: Supabase (via Edge Function)
- All user data synced to `appState:{userId}` in KV store
- Requires authentication
- Accessible across devices

### Fallback: localStorage
- Immediate local backup
- Works offline
- Synced to Supabase when online
- Code in AppContext.tsx (line 339-364)

```typescript
// Data is saved to both locations
localStorage.setItem('trackingAppData', JSON.stringify(state));
await api.saveAppState(state);  // Saves to Supabase
```

## Important Security Notes

1. **Service Role Key**: Never exposed to frontend
   - Only used in server-side code (`/supabase/functions/server/index.tsx`)
   - Used for admin operations like creating users

2. **Anon Key**: Used in frontend
   - For public endpoints (`/user-count`)
   - Safe to expose

3. **Access Tokens**: User-specific
   - Required for protected endpoints
   - Automatically included in API requests
   - Verified on server side

## Troubleshooting

### User can't sign in / Sees onboarding again (MOST COMMON ISSUE)

**This is the issue you're experiencing! Here's what to do:**

1. **Open the app and go to Settings → Data tab**
2. **Look at the "Authentication Debug" section** (purple box at the top)
3. **Check what's missing**:
   - ✅ Green checkmarks = Working
   - ❌ Red X = Problem

#### Common Scenarios:

**Scenario 1: All items missing**
- The browser cleared localStorage or you're in a different browser
- **Fix**: You'll need to sign up/log in again

**Scenario 2: Credentials stored but Access Token missing**
- Token expired or session was cleared
- **Fix**: Refresh the page - the app will auto-login using stored credentials

**Scenario 3: Access Token present but User Profile missing**
- Data wasn't synced from Supabase
- **Fix**: Check browser console for errors, refresh the page

#### Manual Checks (in browser console):

```javascript
// Check what's in localStorage
console.log('Token:', localStorage.getItem('whatever_access_token'));
console.log('Credentials:', localStorage.getItem('whatever_credentials'));
console.log('App Data:', localStorage.getItem('trackingAppData'));
```

#### Force Re-Authentication:

If stuck, clear everything and start fresh:
```javascript
localStorage.clear();
location.reload();
```

Then sign up again. With the new auto-login system, you won't lose your session anymore.

### User data not loading
Check:
1. Is user authenticated? (Access token present)
2. Does `appState:{userId}` key exist in KV store?
3. Check browser console for errors during data fetch
4. Look for "AppContext:" logs in console

### Can't see users in dashboard
1. Verify you're logged into correct Supabase project
2. Check Authentication → Users section
3. Users are created via `supabaseAdmin.auth.admin.createUser()`

### User count mismatch (2 users counted but only 1 in Supabase)
This happens when:
- Signup incremented counter but failed to create user
- Someone started signup but didn't complete it
- Edge function crashed after incrementing counter

**To fix**: 
1. Check Supabase Auth → Users to see actual count
2. Manually update KV store counter if needed
3. The counter is just for display, it doesn't affect functionality

## API Endpoints Summary

| Endpoint | Auth Required | Purpose |
|----------|---------------|---------|
| `/health` | No | Server health check |
| `/user-count` | No (anon key) | Get total user count |
| `/signup` | No (anon key) | Create new user account |
| `/data` | Yes | Get/save user's app data |
| `/projects/*` | Yes | Manage projects |
| `/entries/*` | Yes | Manage entries |
| `/reminders/*` | Yes | Manage reminders |
| `/widgets/*` | Yes | Manage widgets |
| `/user-profile` | Yes | Update user profile |

All protected endpoints verify the user via:
```typescript
const userId = await getUserIdFromAuth(authHeader);
if (!userId) {
  return c.json({ error: 'Unauthorized' }, 401);
}
```
