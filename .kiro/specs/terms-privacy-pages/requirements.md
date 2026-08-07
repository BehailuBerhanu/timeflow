# Requirements Document

## Introduction

Timeflow is an AI-powered calendar SaaS product that connects to users' Google Calendar and other OAuth providers via Supabase authentication. The `/terms` and `/privacy` routes currently return 404, which breaks the legal footer links rendered by `AuthCard` on every sign-up and login screen.

This feature creates two static legal pages — Terms of Service (`/terms`) and Privacy Policy (`/privacy`) — that are real, complete, and visually consistent with the existing marketing site. The pages must accurately reflect the product: an AI assistant that reads calendar data, drafts schedule changes, and requires explicit user approval before applying them; authentication via Supabase magic-link email and Google OAuth; and a "demo mode" where no data leaves the browser.

---

## Glossary

- **Terms_Page**: The server-rendered Next.js page at the `/terms` route.
- **Privacy_Page**: The server-rendered Next.js page at the `/privacy` route.
- **Legal_Page**: Either the Terms_Page or the Privacy_Page when requirements apply equally to both.
- **Site_Header**: The shared marketing header component (`components/marketing/site-header.tsx`).
- **Site_Footer**: The shared marketing footer component (`components/marketing/site-footer.tsx`).
- **AuthCard**: The authentication component (`components/auth-card.tsx`) that links to `/terms` and `/privacy`.
- **Legal_Content**: The prose text body of a Legal_Page (section headings, paragraphs, lists).
- **User**: A person who accesses the Timeflow web application.
- **Visitor**: A person who views a Legal_Page without being authenticated.
- **AI_Assistant**: The Timeflow AI feature that reads calendar context and drafts schedule suggestions.
- **OAuth_Connection**: A third-party calendar or service connection (e.g., Google Calendar) made via OAuth 2.0.
- **Supabase**: The backend-as-a-service used for authentication and data storage.
- **Demo_Mode**: The publicly accessible `/home` experience in which no user data is persisted or transmitted externally.

---

## Requirements

### Requirement 1: Terms of Service Page Route

**User Story:** As a User, I want to access a Terms of Service page at `/terms`, so that I can review the conditions I agreed to when signing up.

#### Acceptance Criteria

1. WHEN a User navigates to `/terms`, THE Terms_Page SHALL render an HTTP 200 response with full page content.
2. THE Terms_Page SHALL include the Site_Header and Site_Footer components, matching the layout of the marketing landing page.
3. THE Terms_Page SHALL export Next.js `metadata` with a `title` of `"Terms of Service — Timeflow"` and a descriptive `description` field.
4. THE Terms_Page SHALL render the Legal_Content as server-side HTML (no client-side data fetching required to display the text).

---

### Requirement 2: Privacy Policy Page Route

**User Story:** As a User, I want to access a Privacy Policy page at `/privacy`, so that I can understand how my calendar data and personal information are handled.

#### Acceptance Criteria

1. WHEN a User navigates to `/privacy`, THE Privacy_Page SHALL render an HTTP 200 response with full page content.
2. THE Privacy_Page SHALL include the Site_Header and Site_Footer components, matching the layout of the marketing landing page.
3. THE Privacy_Page SHALL export Next.js `metadata` with a `title` of `"Privacy Policy — Timeflow"` and a descriptive `description` field.
4. THE Privacy_Page SHALL render the Legal_Content as server-side HTML (no client-side data fetching required to display the text).

---

### Requirement 3: Visual Consistency with Marketing Site

**User Story:** As a Visitor, I want the legal pages to look like the rest of the Timeflow website, so that the experience feels coherent and trustworthy.

#### Acceptance Criteria

1. THE Legal_Page SHALL use the same `bg-background`, `text-foreground`, and `border-border` CSS custom properties as the marketing landing page.
2. THE Legal_Page SHALL apply the same maximum content width (`max-w-[84rem]`) and horizontal padding (`px-5 sm:px-8`) as other marketing sections.
3. THE Legal_Page SHALL render page-level headings using the same typographic scale as the marketing site (bold, tight tracking, `text-foreground`).
4. THE Legal_Page SHALL render body prose using `text-muted-foreground` at a comfortable reading line width (`max-w-3xl` or equivalent).
5. THE Legal_Page SHALL render section dividers using `border-border` consistent with the marketing page section style.
6. WHERE a dark-mode class is applied to the document, THE Legal_Page SHALL display colours from the dark-mode CSS custom properties without layout shifts or unstyled text.

---

### Requirement 4: Terms of Service Legal Content

**User Story:** As a User, I want the Terms of Service to accurately describe my rights and obligations when using Timeflow, so that I understand what I am agreeing to.

#### Acceptance Criteria

1. THE Terms_Page SHALL include a section titled **"Acceptance of Terms"** stating that use of the service constitutes agreement to the terms.
2. THE Terms_Page SHALL include a section titled **"Description of Service"** that describes Timeflow as an AI-powered calendar assistant that reads calendar data, drafts schedule changes, and requires user approval before applying any change.
3. THE Terms_Page SHALL include a section titled **"User Accounts and Authentication"** covering account creation via magic-link email and Google OAuth through Supabase.
4. THE Terms_Page SHALL include a section titled **"Acceptable Use"** specifying that Users SHALL NOT use the service for unlawful purposes, attempt to reverse-engineer the AI models, or interfere with other users' accounts.
5. THE Terms_Page SHALL include a section titled **"AI-Generated Suggestions"** stating that the AI_Assistant produces draft suggestions only, that Timeflow does not guarantee the accuracy of suggestions, and that the User is responsible for reviewing and approving all AI-generated calendar changes.
6. THE Terms_Page SHALL include a section titled **"Intellectual Property"** stating that Timeflow and its content are owned by the service operator.
7. THE Terms_Page SHALL include a section titled **"Termination"** describing conditions under which access may be suspended or terminated.
8. THE Terms_Page SHALL include a section titled **"Limitation of Liability"** containing a disclaimer of warranties and limitation of damages.
9. THE Terms_Page SHALL include a section titled **"Changes to Terms"** stating that Timeflow may update the terms and will notify users of material changes.
10. THE Terms_Page SHALL include a section titled **"Contact"** with an instruction for Users to reach the operator by email for terms-related questions.
11. THE Terms_Page SHALL display the date the terms were last updated, in a human-readable format (e.g., `Last updated: June 2025`).

---

### Requirement 5: Privacy Policy Legal Content

**User Story:** As a User, I want the Privacy Policy to clearly explain what data Timeflow collects, how it is used, and what rights I have, so that I can make an informed decision about using the service.

#### Acceptance Criteria

1. THE Privacy_Page SHALL include a section titled **"Information We Collect"** listing: email address (from authentication), OAuth access tokens for connected calendar services, calendar event data accessed during an active session, and usage and interaction data.
2. THE Privacy_Page SHALL include a section titled **"How We Use Your Information"** explaining that data is used to provide the AI calendar assistant service, authenticate the User, and generate schedule suggestions.
3. THE Privacy_Page SHALL include a section titled **"Calendar Data and OAuth Connections"** stating that OAuth_Connection tokens are stored by Supabase and that calendar event data is read only to generate AI suggestions; the AI_Assistant SHALL NOT modify calendar data without explicit User approval.
4. THE Privacy_Page SHALL include a section titled **"Demo Mode"** stating that in Demo_Mode no personal data is collected or transmitted to external servers.
5. THE Privacy_Page SHALL include a section titled **"Data Sharing"** stating that Timeflow does not sell personal data, and describing any third-party services (Supabase, Google OAuth, Vercel) that process data on Timeflow's behalf.
6. THE Privacy_Page SHALL include a section titled **"Data Retention"** describing how long user data is retained and how Users can request deletion.
7. THE Privacy_Page SHALL include a section titled **"Your Rights"** listing rights including access, correction, deletion, and revocation of OAuth_Connection consent.
8. THE Privacy_Page SHALL include a section titled **"Cookies and Tracking"** stating what cookies or session tokens are used and their purpose.
9. THE Privacy_Page SHALL include a section titled **"Security"** describing security measures including Supabase Row Level Security and encrypted OAuth token storage.
10. THE Privacy_Page SHALL include a section titled **"Changes to This Policy"** stating that material changes will be communicated to users.
11. THE Privacy_Page SHALL include a section titled **"Contact"** with an instruction for Users to reach the operator by email for privacy-related questions.
12. THE Privacy_Page SHALL display the date the policy was last updated, in a human-readable format (e.g., `Last updated: June 2025`).

---

### Requirement 6: AuthCard Link Resolution

**User Story:** As a User on the sign-up or login screen, I want the "Terms of Service" and "Privacy Policy" links in the legal footer to work, so that I can read the policies before completing registration.

#### Acceptance Criteria

1. WHEN a User clicks the "Terms of Service" anchor in AuthCard, THE Browser SHALL navigate to `/terms` and THE Terms_Page SHALL render without a 404 error.
2. WHEN a User clicks the "Privacy Policy" anchor in AuthCard, THE Browser SHALL navigate to `/privacy` and THE Privacy_Page SHALL render without a 404 error.
3. THE Terms_Page and THE Privacy_Page SHALL be navigable without authentication (accessible to unauthenticated Visitors).

---

### Requirement 7: Page Navigation and Cross-Linking

**User Story:** As a Visitor reading one legal document, I want easy access to the other legal document and the main site, so that I can navigate without using the browser back button.

#### Acceptance Criteria

1. THE Legal_Page SHALL render the Site_Header with all existing navigation links functional.
2. THE Legal_Page SHALL render the Site_Footer with all existing footer links functional.
3. THE Terms_Page SHALL include a link to the Privacy_Page within its Legal_Content that is visible and accessible to users (not hidden via CSS or other styling).
4. THE Privacy_Page SHALL include a link to the Terms_Page within its Legal_Content that is visible and accessible to users (not hidden via CSS or other styling).

---

### Requirement 8: Accessibility

**User Story:** As a User relying on assistive technology, I want the legal pages to be navigable and readable, so that I can access the content regardless of my abilities.

#### Acceptance Criteria

1. THE Legal_Page SHALL use a single `<h1>` element as the page title.
2. THE Legal_Page SHALL use `<h2>` elements for each top-level section heading in Legal_Content, maintaining a logical heading hierarchy.
3. THE Legal_Page SHALL maintain a minimum color-contrast ratio of 4.5:1 between body text and background in both light and dark modes, using the existing design-token values.
4. THE Legal_Page SHALL not rely solely on color to convey information.
5. WHEN a User uses keyboard navigation, THE Legal_Page's interactive elements (header nav links, footer links, in-content links) SHALL be reachable and visually focusable via the existing `focus-visible:ring` styles.
