# Design Document — AI Suggestion Engine Hardening

## Overview

Three isolated stages that harden the AI suggestion pipeline. Each stage is independently deployable and testable. This document covers all three stages; implementation proceeds in order: Stage 1 → Stage 2 → Stage 3.

---

## Stage 1 — Reliability Fixes

### Files Modified

| File | Change |
|------|--------|
| `lib/gemini-suggestions.ts` | Hard timeout, tighter schema validation, expanded retry |
| `app/api/suggestions/generate/route.ts` | Error handling for rate-limit count query and duplicate-check query |

### 1.1 Hard Timeout — `lib/gemini-suggestions.ts`

Wrap `groq.chat.completions.create()` with `AbortController` + `Promise.race`:

```ts
const TIMEOUT_MS = 30_000

async function callWithTimeout(groq: Groq, prompt: string, signal: AbortSignal) {
  return groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 512,
  }, { signal })
}

// Inside the retry loop:
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

try {
  const completion = await Promise.race([
    callWithTimeout(groq, prompt, controller.signal),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GROQ_TIMEOUT')), TIMEOUT_MS)
    ),
  ])
  clearTimeout(timer)
  // ... process completion
} catch (err) {
  clearTimeout(timer)
  // treat GROQ_TIMEOUT as retryable
}
```

Each retry gets a fresh `AbortController` and a fresh timer. On timeout at the final attempt, return `null`.

### 1.2 Expanded Retry — `lib/gemini-suggestions.ts`

Replace the current `isRateLimit` check with `isRetryable`:

```ts
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    /429|rate.?limit|quota/i.test(msg) ||           // Rate_Limit_Error
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket|GROQ_TIMEOUT/i.test(msg) // Network_Error + Timeout
  )
}
```

Delay formula stays `2000 * attempt` ms between retries.

### 1.3 Tightened Schema Validation — `lib/gemini-suggestions.ts`

Extract a `validateProposal()` function that replaces the existing 3-field check:

```ts
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonEmptyString(v: unknown, maxLen = 500): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen
}

function validateProposal(parsed: unknown): SuggestionProposal | null {
  if (!isPlainObject(parsed)) {
    console.error('[gemini-suggestions] Proposal is not a plain object:', parsed)
    return null
  }

  // Top-level string fields
  for (const field of ['event_id', 'title', 'reason'] as const) {
    if (!isNonEmptyString(parsed[field])) {
      console.error(`[gemini-suggestions] Invalid proposal — '${field}': ${JSON.stringify(parsed[field])}`)
      return null
    }
  }

  // Nested objects
  for (const nested of ['current', 'proposed'] as const) {
    const obj = parsed[nested]
    if (!isPlainObject(obj) || Object.keys(obj).length === 0) {
      console.error(`[gemini-suggestions] Invalid proposal — missing or malformed '${nested}': ${JSON.stringify(obj)}`)
      return null
    }
    for (const sub of ['date', 'start_time', 'end_time', 'calendar'] as const) {
      if (!isNonEmptyString((obj as Record<string, unknown>)[sub], 50)) {
        console.error(`[gemini-suggestions] Invalid proposal — '${nested}.${sub}': ${JSON.stringify((obj as Record<string, unknown>)[sub])}`)
        return null
      }
    }
  }

  return parsed as SuggestionProposal
}
```

### 1.4 Generate Route Error Handling — `app/api/suggestions/generate/route.ts`

Add destructured `error` checks to the two currently-unguarded queries:

**Rate-limit count query** (currently destructures only `count`):
```ts
const { count, error: countError } = await supabase
  .from('suggestions')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', todayStart.toISOString())

if (countError) {
  console.error('[suggestions/generate] daily-limit-check:', countError)
  return NextResponse.json({ error: 'Failed to check daily limit' }, { status: 500 })
}
```

**Duplicate-check query** (currently destructures only `data: existing`):
```ts
const { data: existing, error: dupError } = await supabase
  .from('suggestions')
  .select('id')
  .eq('user_id', userId)
  .eq('event_id', proposal.event_id)
  .in('status', ['rejected', 'pending'])
  .maybeSingle()

if (dupError) {
  console.error('[suggestions/generate] duplicate-check:', dupError)
  return NextResponse.json({ error: 'Failed to check for duplicate suggestion' }, { status: 500 })
}
```

---

## Stage 2 — User Preferences & Onboarding

### Files Added/Modified

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_user_preferences.sql` | New table + trigger + RLS |
| `app/api/preferences/route.ts` | POST upsert endpoint |
| `hooks/use-preferences.ts` | Client hook — fetches user_preferences |
| `components/onboarding-modal.tsx` | One-time onboarding UI |
| `lib/gemini-suggestions.ts` | Add optional `preferences` param to `generateSuggestion` |
| `app/api/suggestions/generate/route.ts` | Fetch preferences, pass to AI |

### Schema

```sql
CREATE TABLE user_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_labels JSONB NOT NULL DEFAULT '{}',
  focus_hours   JSONB NOT NULL DEFAULT 'null'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_preferences" ON user_preferences
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Prompt Augmentation

```ts
export type UserPreferences = {
  calendar_labels: Record<string, 'work' | 'personal'>
  focus_hours: { start: string; end: string } | null
}

function buildPrompt(events, userTimezone, preferences?) {
  // ... existing prompt ...
  let prefSection = ''
  if (preferences) {
    const labels = Object.entries(preferences.calendar_labels)
      .map(([name, label]) => `  - "${name}": ${label}`)
      .join('\n')
    if (labels) prefSection += `\nCalendar labels:\n${labels}`
    if (preferences.focus_hours) {
      prefSection += `\nProtected focus window: ${preferences.focus_hours.start}–${preferences.focus_hours.end} — do not propose any event change that starts or ends within this time range.`
    }
  }
  return `${existingPrompt}${prefSection}`
}
```

---

## Stage 3 — Rejection Feedback Loop

### Files Added/Modified

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_dismissed_patterns.sql` | New table + index + RLS |
| `app/api/suggestions/[id]/reject/route.ts` | Record normalized title after rejection |
| `app/api/suggestions/generate/route.ts` | Fetch patterns, suppress matching proposals |

### Schema

```sql
CREATE TABLE dismissed_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_title_pattern TEXT NOT NULL,
  dismissed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dismissed_patterns_user_time ON dismissed_patterns (user_id, dismissed_at);

ALTER TABLE dismissed_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_dismissed" ON dismissed_patterns
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Normalization

```ts
function normalizeTitle(title: string): string {
  return title.toLowerCase().trim()
}
```

### Suppression Check in Generate Route

```ts
// After duplicate-check, before generateSuggestion:
const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
const { data: patterns, error: patternError } = await supabase
  .from('dismissed_patterns')
  .select('event_title_pattern')
  .eq('user_id', userId)
  .gte('dismissed_at', windowStart)

if (patternError) {
  console.error('[suggestions/generate] dismissed-patterns-fetch:', patternError)
}
const dismissedTitles = new Set((patterns ?? []).map(p => p.event_title_pattern))

// After AI returns proposal:
const normalizedTitle = normalizeTitle(proposal.title)
if (dismissedTitles.has(normalizedTitle)) {
  console.log(`[suggestions/generate] skipped — matches dismissed pattern: "${normalizedTitle}"`)
  return NextResponse.json({ message: 'skipped — matches dismissed pattern' })
}
```
