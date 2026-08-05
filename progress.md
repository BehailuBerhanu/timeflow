# Timeflow Calendar — Progress Log

## Session Summary (Aug 5, 2026)

---

### ✅ Completed

#### 1. Supabase Auth Integration
- Added `@supabase/ssr` and `@supabase/supabase-js` packages
- Created browser client: `lib/supabase/client.ts`
- Created server client: `lib/supabase/server.ts`
- Created middleware helper: `lib/supabase/middleware.ts`
- Added `hooks/use-user.ts` — subscribes to auth state changes, returns current user
- Added `app/login/page.tsx` — Google OAuth sign-in page with inline Google logo, error display
- Added `app/auth/callback/route.ts` — exchanges OAuth code for session, sets cookies on redirect response

#### 2. Route Structure Refactor
- Moved full calendar UI from `app/page.tsx` → `app/calendar/page.tsx`
- `app/page.tsx` now redirects to `/home` (avoids middleware dead-end on unauthenticated `/`)
- Auth callback redirects to `/home` after successful sign-in
- Updated `components/sidebar.tsx`: Calendar nav link changed from `/` → `/calendar`
- Updated `components/home-view.tsx`: All internal links updated from `/` → `/calendar`
- Updated `components/top-bar.tsx`: Logo link updated from `/` → `/calendar`

#### 3. TopBar & HomeView Enhancements
- `top-bar.tsx`: Added user avatar, initials fallback, sign-out dropdown using Supabase client
- `home-view.tsx`: Displays signed-in user's name, avatar, greeting based on time of day

#### 4. Next.js 16 Proxy Migration
- Renamed `middleware.ts` → `proxy.ts`
- Updated export from `middleware` → `proxy` (required by Next.js 16)

---

### 🔧 Auth Bug Fixes Applied

| Issue | Fix |
|---|---|
| Sign-in loop after OAuth | Callback was redirecting to `/` which middleware blocked; changed to `/home` |
| Cookie not written to response | Rewrote callback to build `NextResponse.redirect` first, then write cookies onto it |
| Build error on proxy.ts | Renamed exported function from `middleware` to `proxy` |
| `Unable to exchange external code` | Root cause: Google Cloud Console missing Supabase callback URI |

---

### ⚠️ Pending / In Progress

#### Google OAuth — Manual Config Required
The auth flow fails with `Unable to exchange external code: unexpected_failure` because the Supabase callback URL is not registered in Google Cloud Console.

**Steps to fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs**, add:
   ```
   https://ykjjgnwudapnynvgaozn.supabase.co/auth/v1/callback
   ```
3. Click **Save** and wait ~30 seconds
4. Also verify in Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs includes: `http://localhost:3000/auth/callback`

---

### 📁 Files Changed (this session)

```
app/page.tsx                        — redirect to /home
app/calendar/page.tsx               — full calendar UI (new)
app/login/page.tsx                  — sign-in page (new)
app/auth/callback/route.ts          — OAuth callback handler (new)
components/home-view.tsx            — user greeting + links updated
components/top-bar.tsx              — user avatar/dropdown + links updated
components/sidebar.tsx              — calendar nav link updated
hooks/use-user.ts                   — auth state hook (new)
lib/supabase/client.ts              — browser Supabase client (new)
lib/supabase/server.ts              — server Supabase client (new)
lib/supabase/middleware.ts          — session refresh helper (new)
proxy.ts                            — Next.js 16 proxy (renamed from middleware.ts)
package.json / package-lock.json    — added @supabase/ssr, @supabase/supabase-js
```

---

### 🔜 Next Steps
- Confirm Google OAuth is working end-to-end after adding the redirect URI
- Remove debug `console.log` lines from `lib/supabase/middleware.ts` once auth is confirmed working
- Consider persisting calendar data to Supabase (currently stored in local state only)
