# Requirements Document

## Introduction

This feature replaces the minimal `/login` page and adds a new `/signup` page for Timeflow — an AI calendar app. Both pages follow a professional auth card design (similar to Vercel/v0's auth screens), support Supabase Auth with passwordless email (magic link/OTP) plus three OAuth providers (Google, GitHub, LinkedIn), and fully respect the app's existing light/dark theme system. Shared components keep the two pages in sync.

## Glossary

- **Auth_Page**: Either the `/login` or `/signup` page, both sharing the same visual structure.
- **Auth_Card**: The centered card component (max-width ~440 px) that contains the auth form, OAuth buttons, and surrounding copy.
- **OAuth_Buttons**: The full-width outlined buttons for Google, GitHub, and LinkedIn sign-in.
- **Email_Flow**: The passwordless magic link / OTP flow triggered by the email input and "Continue with Email" button.
- **Theme_System**: The app's existing light/dark mode mechanism, driven by a `.dark` class on `<html>` and managed via `useStore()` (`state.theme`, `setTheme`, `toggleTheme`).
- **Callback_Route**: The existing Next.js route handler at `/auth/callback/route.ts` that exchanges an OAuth/OTP code for a session.
- **Supabase_Client**: The browser-side Supabase client created via `createClient()` from `@/lib/supabase/client`.
- **Theme_Toggle**: The Sun/Moon icon button that calls `toggleTheme()` from `useStore()`.
- **Provider**: One of the three OAuth identity providers: `'google'`, `'github'`, or `'linkedin_oidc'`.

---

## Requirements

### Requirement 1: Auth Card Layout

**User Story:** As a visitor, I want a clean, focused auth page so that I can sign in or sign up without distractions.

#### Acceptance Criteria

1. THE Auth_Card SHALL be centered horizontally and vertically on the viewport using full-viewport-height flexbox layout.
2. THE Auth_Card SHALL have a maximum width of 440 px and on viewports narrower than 440 px SHALL expand to fill the available width with horizontal padding of at least 16 px on each side to prevent content from touching the screen edge.
3. THE Auth_Card SHALL display a heading at font-size 22 px and font-weight bold: "Sign in to Timeflow" on `/login` and "Create your Timeflow account" on `/signup`.
4. THE Auth_Card SHALL display a short subtext line beneath the heading: "Your AI calendar — sign in to get started." on `/login` and "Start organizing your schedule with AI." on `/signup`.
5. THE Auth_Card SHALL use `rounded-xl` corner radius, a subtle border (`border-border`), and the `bg-panel` surface color.
6. THE Auth_Card SHALL display a footer line: "By continuing, you agree to our Terms of Service and Privacy Policy" at the bottom of the card.
7. THE Auth_Card SHALL display a navigation link below the footer: on `/login` the link SHALL read "Don't have an account? Sign Up" and navigate to `/signup`; on `/signup` the link SHALL read "Already have an account? Sign In" and navigate to `/login`.

---

### Requirement 2: Theme Compliance

**User Story:** As a visitor, I want the auth pages to match whatever theme (light or dark) I've selected so that the experience feels consistent with the rest of the app.

#### Acceptance Criteria

1. THE Auth_Page SHALL apply the CSS-variable-backed Tailwind tokens `bg-background` (page background), `bg-panel` (card container), `text-foreground` (body text), `border-border` (all borders), and `text-muted-foreground` (secondary text) to their respective elements; no hardcoded color hex values or color utility classes outside this token set SHALL appear on these elements.
2. WHEN the `.dark` class is present on the `<html>` element, THE Auth_Page SHALL render using the dark-mode CSS variable values defined in the `.dark` ruleset in `globals.css` for all themed elements.
3. WHEN the `.dark` class is absent from the `<html>` element, THE Auth_Page SHALL render using the `:root` CSS variable values defined in `globals.css` for all themed elements.
4. THE Auth_Page SHALL include a Theme_Toggle button in the top-right corner so users can switch themes without leaving the page.
5. WHILE the current theme is `'light'`, THE Theme_Toggle SHALL display the Moon icon (from `lucide-react`).
6. WHILE the current theme is `'dark'`, THE Theme_Toggle SHALL display the Sun icon (from `lucide-react`).
7. WHEN the Theme_Toggle button is clicked, THE Auth_Page SHALL call `toggleTheme()` from `useStore()`, causing the `.dark` class to be toggled on `<html>` and all themed elements to re-render with the new theme's CSS variables.
8. WHEN the auth page first renders and no theme preference has been saved in `localStorage`, THE Theme_System SHALL reflect the user's OS-level `prefers-color-scheme` preference — light or dark — before the page's first visible paint, so that no flash of the opposite theme occurs on initial load.

---

### Requirement 3: Email (Magic Link / OTP) Flow

**User Story:** As a visitor, I want to sign in with my email via a magic link so that I don't need to remember a password.

#### Acceptance Criteria

1. THE Auth_Card SHALL display a text input with placeholder `name@work-email.com` for the user's email address.
2. THE Auth_Card SHALL display a "Continue with Email" button below the email input, styled as a solid primary button using `bg-primary` and `text-primary-foreground`.
3. WHEN the user submits an email address matching the format `local-part@domain` (with no leading or trailing whitespace), THE Supabase_Client SHALL call `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: \`\${origin}/auth/callback\` } })`.
4. WHEN the OTP call succeeds, THE Auth_Card SHALL hide the email input and "Continue with Email" button and display an inline success message containing "Check your email for a sign-in link".
5. IF the OTP call returns an error, THEN THE Auth_Card SHALL display an inline error message above the email form describing the failure, and the email form SHALL remain visible so the user can retry.
6. WHILE the OTP request is in flight, THE "Continue with Email" button SHALL be disabled, display a loading spinner, and show label text "Sending…" to prevent double-submission.
7. IF the email input is empty or contains only whitespace when the user clicks "Continue with Email", THEN THE Auth_Card SHALL display a validation message prompting the user to enter an email address without submitting to Supabase.
8. WHEN the success message is displayed, THE "Continue with Email" button SHALL remain hidden so that the user cannot re-submit the same email address until the page is reloaded or the email input is changed.

---

### Requirement 4: OAuth Provider Buttons

**User Story:** As a visitor, I want to sign in with Google, GitHub, or LinkedIn so that I can use an existing account instead of a separate password.

#### Acceptance Criteria

1. THE OAuth_Buttons section SHALL appear below a horizontal divider (with "or" label) separating it from the Email_Flow section.
2. THE OAuth_Buttons SHALL include three full-width buttons stacked vertically: "Continue with Google", "Continue with GitHub", and "Continue with LinkedIn".
3. THE OAuth_Buttons SHALL be styled with a border using the `border-border` token, a transparent background, and `text-foreground` text color; on hover each button SHALL transition its background to the `bg-secondary` surface to provide visible feedback in both light and dark themes.
4. WHEN a user clicks "Continue with Google", THE Auth_Page SHALL initiate an OAuth redirect to Google's authorization endpoint via Supabase with provider `'google'` and `redirectTo` set to `${origin}/auth/callback`.
5. WHEN a user clicks "Continue with GitHub", THE Auth_Page SHALL initiate an OAuth redirect to GitHub's authorization endpoint via Supabase with provider `'github'` and `redirectTo` set to `${origin}/auth/callback`.
6. WHEN a user clicks "Continue with LinkedIn", THE Auth_Page SHALL initiate an OAuth redirect to LinkedIn's authorization endpoint via Supabase with provider `'linkedin_oidc'` and `redirectTo` set to `${origin}/auth/callback`.
7. WHILE an OAuth redirect is in flight (from the moment the button is clicked until the browser follows the redirect), THE clicked OAuth button SHALL be disabled and display a loading spinner, and all other OAuth buttons SHALL also be disabled to prevent concurrent redirect attempts.
8. THE Google button SHALL display the official multicolor Google "G" SVG icon aligned to the left of the label.
9. THE GitHub button SHALL display the GitHub mark SVG icon aligned to the left of the label; the icon SHALL inherit `currentColor` so it appears dark in light mode and light in dark mode matching the `text-foreground` token.
10. THE LinkedIn button SHALL display the LinkedIn "in" SVG icon in LinkedIn's brand blue (`#0A66C2`) aligned to the left of the label.
11. IF initiating an OAuth redirect returns an error from Supabase, THEN THE Auth_Card SHALL display an inline error message above the OAuth buttons describing the failure, and all OAuth buttons SHALL be re-enabled.

---

### Requirement 5: Error Handling from Redirect

**User Story:** As a visitor who was redirected back after a failed auth attempt, I want to see a clear error message so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN the Auth_Page URL contains an `?error=` query parameter on page load, THE Auth_Card SHALL display the URL-decoded value of that parameter in an inline error banner above the email form.
2. WHEN the error banner is displayed from a query parameter, THE Auth_Page SHALL call `window.history.replaceState` to remove the `?error=` parameter from the browser URL so that reloading the page does not re-display the same error.
3. IF no `?error=` parameter is present in the URL on page load, THEN THE Auth_Card SHALL not render the error banner.

---

### Requirement 6: Auth Callback Route

**User Story:** As a user completing an OAuth or magic-link flow, I want to be seamlessly redirected into the app so that the sign-in process feels instant.

#### Acceptance Criteria

1. WHEN the Callback_Route receives a request with a non-empty `code` query parameter, THE Callback_Route SHALL call `supabase.auth.exchangeCodeForSession(code)` and on success redirect the user to `/home`.
2. IF the Callback_Route receives a request without a `code` query parameter, THEN THE Callback_Route SHALL redirect the user to `/login`.
3. IF `exchangeCodeForSession` returns an error, THEN THE Callback_Route SHALL redirect the user to `/login?error=Could+not+sign+in.+Please+try+again.` and the redirect response SHALL NOT carry an authenticated session.
4. THE Callback_Route SHALL use `createServerClient` from `@supabase/ssr` and write session cookies onto the redirect response so subsequent server-side requests have an authenticated session.
5. WHEN a `next` query parameter is present and its value starts with `/`, THE Callback_Route SHALL redirect to `${origin}${next}` on success instead of `/home`.
6. IF a `next` query parameter is present but its value does not start with `/`, THEN THE Callback_Route SHALL ignore the `next` value and redirect to `/home` as the default destination.

---

### Requirement 7: Shared Components

**User Story:** As a developer, I want the login and signup pages to share common components so that visual changes are applied in one place and both pages stay in sync.

#### Acceptance Criteria

1. THE Auth_Card SHALL be implemented as a reusable `AuthCard` component located at `components/auth-card.tsx`, imported and rendered by both `app/login/page.tsx` and `app/signup/page.tsx` with no duplication of card markup between those two files.
2. THE OAuth_Buttons SHALL be implemented as a reusable `OAuthButtons` component located at `components/oauth-buttons.tsx`, imported and rendered inside `AuthCard`; when an OAuth error occurs, `OAuthButtons` SHALL accept and display the error via a prop passed down from `AuthCard`.
3. THE Theme_Toggle on auth pages SHALL call `toggleTheme()` and read `state.theme` from `useStore()` with no additional theme context, provider, or library introduced.
4. THE `AuthCard` component SHALL accept a `mode` prop of type `'login' | 'signup'`; WHEN `mode` is `'login'` THE component SHALL render the heading "Sign in to Timeflow", the login subtext, and the "Don't have an account? Sign Up" link; WHEN `mode` is `'signup'` THE component SHALL render the heading "Create your Timeflow account", the signup subtext, and the "Already have an account? Sign In" link.

---

### Requirement 8: Accessibility and Responsiveness

**User Story:** As a visitor using any device or assistive technology, I want the auth pages to be usable so that I can sign in regardless of how I access the app.

#### Acceptance Criteria

1. THE Auth_Page SHALL center the Auth_Card vertically and horizontally on all viewport widths from 320 px to 1920 px, with the Auth_Card width constrained so that it never exceeds its maximum width nor causes horizontal overflow of the page.
2. THE email input SHALL have an associated `<label>` element or `aria-label` attribute that identifies its purpose to assistive technologies.
3. WHEN the sign-in button enters a loading state, THE Auth_Page SHALL expose `aria-busy="true"` on the button element and provide a text alternative for the loading spinner via `aria-label` or `role="status"` so that the loading state is announced to screen readers.
4. ALL interactive elements (inputs, buttons, links) SHALL have a visible focus indicator of at least 2 px width that achieves a minimum 3:1 contrast ratio against the immediately adjacent background color when focused via keyboard navigation.
5. THE Auth_Card SHALL display all body text at a contrast ratio of at least 4.5:1, and all large text (18 px or 14 px bold and above) and non-text UI components at a contrast ratio of at least 3:1, against the Auth_Card background surface in both light and dark themes, conforming to WCAG 2.1 Level AA.
6. WHEN an authentication error occurs, THE Auth_Page SHALL render the error message in a live region with `role="alert"` or `aria-live="assertive"` so that screen readers announce the error without requiring the user to navigate to it.
