# Implementation Tasks

## Stage 1 — Reliability Fixes

- [ ] 1. Harden lib/gemini-suggestions.ts
  - Add 30-second AbortController + Promise.race timeout on the Groq call; treat GROQ_TIMEOUT as retryable
  - Expand isRetryable to also match ECONNRESET, ETIMEDOUT, ENOTFOUND, "fetch failed", "socket"
  - Replace the 3-field proposal check with a full validateProposal() that checks current and proposed are plain non-empty objects, each with date/start_time/end_time/calendar as non-empty strings; log field name + value on any failure
  - Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4

- [ ] 2. Harden app/api/suggestions/generate/route.ts
  - Add error check on the daily-rate-limit count query; log [suggestions/generate] daily-limit-check and return 500
  - Add error check on the duplicate-check query; log [suggestions/generate] duplicate-check and return 500
  - Requirements: 4.1, 4.2, 4.3, 4.4

## Stage 2 — User Preferences & Onboarding

- [ ] 3. Add user_preferences Supabase migration
  - Requirements: 5.1, 5.2, 5.3

- [ ] 4. Add POST /api/preferences route
  - Requirements: 6.5, 6.6, 6.7

- [ ] 5. Add hooks/use-preferences.ts hook
  - Requirements: 6.1, 6.2

- [ ] 6. Build components/onboarding-modal.tsx
  - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7

- [ ] 7. Update AI prompt and generate route for preferences
  - Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

## Stage 3 — Rejection Feedback Loop

- [ ] 8. Add dismissed_patterns Supabase migration
  - Requirements: 8.1, 8.2, 8.3

- [ ] 9. Update reject route to record dismissed pattern
  - Requirements: 9.1, 9.2, 9.3, 9.4

- [ ] 10. Update generate route with pattern fetch and suppression check
  - Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5
