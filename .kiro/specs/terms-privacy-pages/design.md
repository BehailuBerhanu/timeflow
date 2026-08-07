# Design Document

## Overview

Two static Next.js App Router pages — `/terms` and `/privacy` — that resolve the 404s linked from `AuthCard`. Both pages reuse the existing `SiteHeader` and `SiteFooter` marketing components and follow the established Tailwind CSS v4 design tokens. All content is rendered server-side as static HTML; no client-side data fetching is required.

---

## Architecture

### File Structure

```
app/
├── terms/
│   └── page.tsx          ← Terms of Service page (server component)
└── privacy/
    └── page.tsx          ← Privacy Policy page (server component)

components/
└── marketing/
    └── legal-content.tsx ← Shared prose layout primitives (LegalPage, LegalSection, etc.)
```

No new routes, API endpoints, database tables, or client components are needed.

### Shared Layout Primitives (`components/marketing/legal-content.tsx`)

A thin set of presentational components used by both pages to avoid duplication:

```tsx
// Wraps the full page body between SiteHeader and SiteFooter
LegalPage({ title, label, lastUpdated, children })

// One titled section with an <h2> heading
LegalSection({ id, title, children })
```

`LegalPage` composes `SiteHeader` + `SiteFooter` and renders a centred content column. It does **not** use `'use client'` — both pages remain pure server components.

---

## Component Design

### `LegalPage`

```
<div class="bg-background text-foreground min-h-dvh">
  <SiteHeader />
  <main>
    <div class="mx-auto max-w-[84rem] px-5 sm:px-8 py-16 lg:py-24">
      <!-- eyebrow label -->
      <span class="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-text">
        {label}
      </span>
      <!-- h1 -->
      <h1 class="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] leading-[1.06] text-foreground">
        {title}
      </h1>
      <!-- last updated -->
      <p class="mt-3 text-[13px] text-muted-foreground">Last updated: {lastUpdated}</p>
      <!-- divider -->
      <div class="mt-10 border-t border-border" />
      <!-- prose column -->
      <div class="mt-10 max-w-3xl flex flex-col gap-12">
        {children}
      </div>
    </div>
  </main>
  <SiteFooter />
</div>
```

### `LegalSection`

```
<section id={id} aria-labelledby={id + "-heading"} class="flex flex-col gap-4 scroll-mt-24">
  <h2 id={id + "-heading"} class="text-[18px] font-bold tracking-[-0.02em] text-foreground">
    {title}
  </h2>
  <div class="flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
    {children}
  </div>
</section>
```

Paragraphs use `<p>`. Unordered lists use `<ul class="list-disc list-outside pl-5 flex flex-col gap-1.5">` with `<li>` items.

---

## Page Designs

### `/terms` — Terms of Service

**Metadata:**
```ts
export const metadata: Metadata = {
  title: 'Terms of Service — Timeflow',
  description: 'Read the Terms of Service for Timeflow, the AI calendar assistant.',
}
```

**Sections (in order):**

| # | `id` | `h2` title |
|---|------|------------|
| 1 | `acceptance` | Acceptance of Terms |
| 2 | `description` | Description of Service |
| 3 | `accounts` | User Accounts and Authentication |
| 4 | `acceptable-use` | Acceptable Use |
| 5 | `ai-suggestions` | AI-Generated Suggestions |
| 6 | `ip` | Intellectual Property |
| 7 | `termination` | Termination |
| 8 | `liability` | Limitation of Liability |
| 9 | `changes` | Changes to Terms |
| 10 | `contact` | Contact |

A cross-link to `/privacy` appears at the bottom of the content, above the `SiteFooter`.

---

### `/privacy` — Privacy Policy

**Metadata:**
```ts
export const metadata: Metadata = {
  title: 'Privacy Policy — Timeflow',
  description: 'Read the Privacy Policy for Timeflow, the AI calendar assistant.',
}
```

**Sections (in order):**

| # | `id` | `h2` title |
|---|------|------------|
| 1 | `info-collect` | Information We Collect |
| 2 | `how-we-use` | How We Use Your Information |
| 3 | `calendar-oauth` | Calendar Data and OAuth Connections |
| 4 | `demo-mode` | Demo Mode |
| 5 | `data-sharing` | Data Sharing |
| 6 | `data-retention` | Data Retention |
| 7 | `your-rights` | Your Rights |
| 8 | `cookies` | Cookies and Tracking |
| 9 | `security` | Security |
| 10 | `changes` | Changes to This Policy |
| 11 | `contact` | Contact |

A cross-link to `/terms` appears at the bottom of the content, above the `SiteFooter`.

---

## Styling Decisions

| Concern | Decision |
|---------|----------|
| Max content width | `max-w-[84rem]` — matches all other marketing sections |
| Prose column width | `max-w-3xl` — comfortable reading measure (~65 chars) |
| Body text colour | `text-muted-foreground` — matches marketing section body copy |
| Section headings | `text-[18px] font-bold tracking-[-0.02em] text-foreground` |
| Page heading | `text-[clamp(2rem,4vw,3rem)]` — consistent with `SectionHeading` |
| Dark mode | Inherited from existing CSS custom properties; no extra work needed |
| Section gap | `gap-12` between sections; `gap-4` inside a section |
| List indent | `pl-5 list-disc list-outside` |
| Cross-link style | `text-foreground underline underline-offset-2 hover:text-brand` — matches AuthCard switch link |

---

## Server Component Strategy

Both `app/terms/page.tsx` and `app/privacy/page.tsx` are **React Server Components** (no `'use client'` directive). `SiteHeader` is a client component (`'use client'`) but can be imported from a server component — Next.js handles the boundary automatically. `SiteFooter` and `LegalPage`/`LegalSection` are all server components.

The `LegalPage` wrapper does **not** need `StoreProvider` because `SiteHeader` is already wrapped by `StoreProvider` at the root layout level (`app/layout.tsx`).

---

## Footer Update

The `SiteFooter` "Trust" column currently links "Privacy" to `#security` (an anchor on the landing page). This should be updated to `/privacy` so the footer link also resolves correctly from any page.

```diff
- { label: 'Privacy', href: '#security' },
+ { label: 'Privacy', href: '/privacy' },
```

---

## Accessibility Notes

- Single `<h1>` per page inside `LegalPage`.
- `<h2>` for every section via `LegalSection`.
- `aria-labelledby` on each `<section>` referencing its heading id.
- All interactive elements (nav links, footer links, cross-links) inherit existing `focus-visible:ring` styles from the design system.
- Colour contrast is provided by existing design tokens (`text-foreground` / `text-muted-foreground` on `bg-background`).
