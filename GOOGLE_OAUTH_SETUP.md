# Google OAuth Setup Guide

## What Was Implemented

✅ Google OAuth 2.0 authentication with Passport.js
✅ Username selection after Google login
✅ Account linking (if email already exists)
✅ Profile picture support
✅ Secure token-based authentication
✅ Beautiful UI with Google button

## Setup Steps

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: AlienVault (or your app name)
   - User support email: your email
   - Developer contact: your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: AlienVault Web Client
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (development)
     - `https://yourapi.com/api/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret**

### 2. Update Environment Variables

Add to `server/.env`:

```env
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

For production, update `GOOGLE_CALLBACK_URL` to your production API URL.

### 3. Update Database Schema

Run Prisma migration:

```bash
cd server
npx prisma generate
npx prisma db push
```

This adds the new OAuth fields to your User model:

- `googleId` (unique)
- `authProvider` (local/google)
- `profilePicture`
- `needsUsername` (flag for username selection)

### 4. Initialize Passport in Server

Add to `server/index.js` (after other imports):

```javascript
import passport from "./config/passport.js";

// Initialize passport
app.use(passport.initialize());
```

### 5. Test the Flow

**Development:**

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Go to `http://localhost:5173/auth`
4. Click "Sign in with Google"
5. Select Google account
6. Choose username
7. Redirected to home page

**Production:**

1. Update `GOOGLE_CALLBACK_URL` in `.env`
2. Add production URLs to Google Console
3. Deploy and test

## How It Works

### Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Redirect to Google consent screen
    ↓
User approves
    ↓
Google redirects to /api/auth/google/callback
    ↓
Backend checks if user exists:
    - By googleId → Login
    - By email → Link account
    - New user → Create account
    ↓
If new user → Redirect to username selection
    ↓
User chooses username
    ↓
JWT token generated
    ↓
Redirect to home page
```

### Database Changes

**Before:**

```prisma
model User {
  username     String  @unique
  email        String  @unique
  passwordHash String
}
```

**After:**

```prisma
model User {
  username       String?  @unique  // Now optional
  email          String   @unique
  passwordHash   String?           // Now optional
  googleId       String?  @unique
  authProvider   String   @default("local")
  profilePicture String?
  needsUsername  Boolean  @default(false)
}
```

### New Routes

**Backend:**

- `GET /api/auth/google` - Initiates OAuth flow
- `GET /api/auth/google/callback` - Handles Google callback
- `POST /api/auth/set-username` - Sets username for OAuth users

**Frontend:**

- `/auth/callback` - Handles successful auth
- `/auth/complete-profile` - Username selection page

## Security Features

✅ **Token validation** - Google tokens verified on backend
✅ **Account linking** - Prevents duplicate accounts
✅ **Secure redirects** - Only to whitelisted URLs
✅ **JWT tokens** - 7-day expiry
✅ **HTTPS required** - In production
✅ **No password storage** - For OAuth users

## Troubleshooting

### "Redirect URI mismatch"

- Check Google Console redirect URIs match exactly
- Include protocol (http/https)
- Include port for localhost

### "Access blocked: This app's request is invalid"

- Configure OAuth consent screen
- Add test users if app is not verified

### "User needs username but not redirected"

- Check `needsUsername` flag in database
- Verify token includes `needsUsername` field

### "Cannot read properties of null"

- Ensure Passport is initialized in server
- Check `passport.js` is imported correctly

## Production Checklist

- [ ] Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Update `GOOGLE_CALLBACK_URL` to production URL
- [ ] Add production URLs to Google Console
- [ ] Update `CLIENT_ORIGIN` in server `.env`
- [ ] Test OAuth flow in production
- [ ] Verify OAuth consent screen is configured
- [ ] Add privacy policy and terms of service URLs

## Features

✅ One-click sign in with Google
✅ No password required
✅ Profile picture from Google
✅ Email pre-verified
✅ Custom username selection
✅ Account linking
✅ Secure JWT authentication
✅ Beautiful UI

## Next Steps (Optional)

- Add GitHub OAuth
- Add Facebook OAuth
- Add profile picture upload
- Add email change functionality
- Add account deletion
- Add OAuth account unlinking
