# Implementation Tasks

## Task List

- [x] 1. Create shared legal layout primitives
  - Create `components/marketing/legal-content.tsx` with `LegalPage` and `LegalSection` components
  - `LegalPage` composes `SiteHeader` + `SiteFooter` with a centred `max-w-[84rem]` column, eyebrow label, `<h1>`, last-updated line, a `border-t border-border` divider, and a `max-w-3xl` prose column for children
  - `LegalSection` renders a `<section>` with `aria-labelledby`, an `<h2>` heading, and a flex column for prose children
  - Both are server components (no `'use client'`)
  - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.5

- [x] 2. Build the Terms of Service page
  - Create `app/terms/page.tsx` as a server component
  - Export `metadata` with `title: 'Terms of Service — Timeflow'` and a descriptive `description`
  - Use `LegalPage` and `LegalSection` from task 1
  - Render all 10 required sections in order: Acceptance of Terms, Description of Service, User Accounts and Authentication, Acceptable Use, AI-Generated Suggestions, Intellectual Property, Termination, Limitation of Liability, Changes to Terms, Contact
  - Include a cross-link to `/privacy` at the bottom of the content
  - Display `Last updated: June 2025` via the `lastUpdated` prop
  - Requirements: 1.1, 1.2, 1.3, 1.4, 4.1–4.11, 6.1, 6.3, 7.1, 7.2, 7.3

- [x] 3. Build the Privacy Policy page
  - Create `app/privacy/page.tsx` as a server component
  - Export `metadata` with `title: 'Privacy Policy — Timeflow'` and a descriptive `description`
  - Use `LegalPage` and `LegalSection` from task 1
  - Render all 11 required sections in order: Information We Collect, How We Use Your Information, Calendar Data and OAuth Connections, Demo Mode, Data Sharing, Data Retention, Your Rights, Cookies and Tracking, Security, Changes to This Policy, Contact
  - Include a cross-link to `/terms` at the bottom of the content
  - Display `Last updated: June 2025` via the `lastUpdated` prop
  - Requirements: 2.1, 2.2, 2.3, 2.4, 5.1–5.12, 6.2, 6.3, 7.1, 7.2, 7.4

- [x] 4. Fix the SiteFooter Privacy link
  - In `components/marketing/site-footer.tsx`, change the "Privacy" link href from `#security` to `/privacy`
  - Requirements: 7.2
