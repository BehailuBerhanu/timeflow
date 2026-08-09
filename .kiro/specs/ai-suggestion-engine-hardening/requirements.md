# Requirements Document

## Introduction

The AI suggestion pipeline (`lib/gemini-suggestions.ts`, `app/api/suggestions/generate/route.ts`, and the approve/reject routes) has several reliability and quality gaps that must be addressed in three ordered stages before the feature is considered production-ready.

**Stage 1** addresses core reliability bugs: an unbounded Groq AI call that can hang indefinitely, weak JSON schema validation that allows malformed proposals to be stored in Supabase, retry logic that misses network-level failures, and missing error handling in the generate route for the daily-rate-limit query and duplicate-check query.

**Stage 2** adds a one-time onboarding step that lets users label their calendars (work vs. personal) and declare protected focus hours, then injects that context into the AI prompt so suggestions respect the user's actual working patterns. A new `user_preferences` Supabase table backs this feature.

**Stage 3** closes a feedback loop: when a user rejects a suggestion, the event title is recorded in a new `dismissed_patterns` table, and future suggestion runs skip any proposal whose normalized title matches a recently-dismissed pattern — suppressing repeated unwanted suggestions for 14 days.

---

## Glossary

- **Groq_AI_Call**: The `groq.chat.completions.create(…)` invocation inside `lib/gemini-suggestions.ts` that contacts the Groq inference API.
- **Hard_Timeout**: A non-negotiable 30-second wall-clock deadline after which the Groq_AI_Call is forcibly aborted via `AbortController` and `Promise.race`.
- **Schema_Validation**: Programmatic verification that a parsed JSON object from the AI contains all required fields with the correct types and shapes before any Supabase write is attempted.
- **Current_Object**: The nested `current` field inside a `SuggestionProposal` that must contain `date`, `start_time`, `end_time`, and `calendar` as non-empty strings.
- **Proposed_Object**: The nested `proposed` field inside a `SuggestionProposal` with the same four required sub-fields as Current_Object.
- **Network_Error**: A Node.js or fetch-layer failure whose message matches `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, or `fetch failed` — distinct from an HTTP error response.
- **Rate_Limit_Error**: An HTTP 429 response or a Groq SDK error whose message matches `/429|rate.?limit|quota/i`.
- **Retryable_Error**: Either a Rate_Limit_Error or a Network_Error; the engine may retry up to `MAX_RETRIES` times before throwing.
- **User_Preferences**: A per-user record stored in the `user_preferences` Supabase table containing calendar labels and focus-hour configuration.
- **Calendar_Label**: A user-assigned classification ("work" or "personal") applied to a Google Calendar by its display name.
- **Focus_Hours**: A single time range (start HH:mm, end HH:mm) representing the user's preferred uninterrupted deep-work window.
- **Onboarding_Screen**: A one-time, skippable UI step shown after first sign-in that collects Calendar_Labels and Focus_Hours.
- **Dismissed_Pattern**: A normalized event title recorded in the `dismissed_patterns` Supabase table when a user rejects a suggestion.
- **Normalized_Title**: An event title converted to lowercase and trimmed of leading/trailing whitespace.
- **Suppression_Window**: The 14-day period starting at `dismissed_at` during which a Dismissed_Pattern blocks matching suggestions.
- **F**: The original, pre-fix function as it exists in the codebase before any stage is applied.
- **F_Prime**: The fixed function after a stage's changes have been applied.

---

## Requirements

### Requirement 1: Hard Timeout on the Groq AI Call

**User Story:** As a user waiting for a new AI suggestion, I want the Groq AI call to fail fast after 30 seconds so that the UI never hangs indefinitely due to an unresponsive upstream service.

#### Acceptance Criteria

1. WHEN the Groq_AI_Call has been in-flight for 30 seconds without a response, THE system SHALL abort the call using `AbortController` and `Promise.race`, log `[gemini-suggestions] Groq call timed out after 30 s`, and return `null` for that attempt.
2. WHEN the Groq_AI_Call completes (success or error) within 30 seconds, THE system SHALL NOT trigger the Hard_Timeout and SHALL process the response normally.
3. WHEN the Hard_Timeout fires on attempt 1 of `MAX_RETRIES`, THE system SHALL treat the timeout as a Retryable_Error and proceed to the next attempt with a fresh `AbortController` and a fresh 30-second deadline.
4. WHEN the Hard_Timeout fires on the final retry attempt, THE system SHALL return `null` (no suggestion generated) and SHALL NOT throw an unhandled exception to the caller.

---

### Requirement 2: Tightened JSON Schema Validation

**User Story:** As a developer maintaining the suggestions feature, I want every AI response to be fully validated before it touches Supabase so that the database never stores proposals with missing or malformed nested objects.

#### Acceptance Criteria

1. WHEN the Groq AI returns a JSON object, THE system SHALL verify that `event_id`, `title`, and `reason` are non-empty strings.
2. WHEN the Groq AI returns a JSON object, THE system SHALL additionally verify that both `current` and `proposed` fields exist and are plain objects (not `null`, not an array, not a primitive).
3. WHEN either Current_Object or Proposed_Object is missing or not a plain object, THE system SHALL log a detailed error identifying the missing field (e.g. `[gemini-suggestions] Invalid proposal — missing or malformed 'current': <serialized value>`) and SHALL return `null` without inserting anything into Supabase.
4. WHEN Current_Object or Proposed_Object is present as a plain object, THE system SHALL verify that each contains `date`, `start_time`, `end_time`, and `calendar` as non-empty strings.
5. WHEN any of those four sub-fields is missing or not a non-empty string, THE system SHALL log a detailed error identifying the specific field and its actual value, and SHALL return `null`.
6. WHEN all required fields pass Schema_Validation, THE system SHALL return the parsed `SuggestionProposal` without modification.

---

### Requirement 3: Expanded Retry Coverage for Network Errors

**User Story:** As a user relying on scheduled suggestion generation, I want transient network failures to be retried automatically so that a momentary connectivity issue does not permanently block the day's suggestion.

#### Acceptance Criteria

1. WHEN a Groq API call fails with a Network_Error, THE system SHALL treat it as a Retryable_Error on the same basis as a Rate_Limit_Error.
2. WHEN a Retryable_Error occurs on attempt 1 of `MAX_RETRIES`, THE system SHALL wait 2 000 ms and then retry.
3. WHEN a Retryable_Error occurs on the final attempt, THE system SHALL rethrow the error to the caller.
4. WHEN a non-network, non-rate-limit error occurs (e.g. an SDK authentication error), THE system SHALL NOT retry and SHALL rethrow immediately.

---

### Requirement 4: Complete Error Handling in the Generate Route

**User Story:** As an operator monitoring the suggestion pipeline, I want every failure point in `app/api/suggestions/generate/route.ts` to be caught and logged so that no unhandled exception silently corrupts state or produces a 500 with no log entry.

#### Acceptance Criteria

1. WHEN the daily-rate-limit count query (`supabase.from('suggestions').select(…)`) fails, THE system SHALL log the Supabase error with prefix `[suggestions/generate]` and return HTTP 500 with `{ error: "Failed to check daily limit" }`.
2. WHEN the duplicate-check query (the `existing` lookup) fails, THE system SHALL log the Supabase error with prefix `[suggestions/generate]` and return HTTP 500 with `{ error: "Failed to check for duplicate suggestion" }`.
3. WHEN the Supabase insert fails, THE system SHALL log the error with prefix `[suggestions/generate]` and return HTTP 500 with `{ error: "Failed to store suggestion" }` — this existing behavior SHALL be verified present and not removed.
4. WHEN any caught error is logged, THE log message SHALL include the route prefix `[suggestions/generate]` and the operation name so log aggregators can filter by stage.

---

### Requirement 5: user_preferences Supabase Table

**User Story:** As a developer, I want a `user_preferences` table in Supabase so that per-user calendar labels and focus hours can be persisted and queried by the suggestion engine.

#### Acceptance Criteria

1. WHEN the migration is applied, THE system SHALL have a `user_preferences` table with columns: `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `calendar_labels JSONB NOT NULL DEFAULT '{}'`, `focus_hours JSONB NOT NULL DEFAULT 'null'`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, and `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
2. WHEN a `user_preferences` row is updated, THE `updated_at` column SHALL be refreshed automatically via a Postgres trigger or equivalent mechanism.
3. WHEN a user's auth account is deleted, THE system SHALL cascade-delete their `user_preferences` row.

---

### Requirement 6: One-Time Onboarding Screen

**User Story:** As a first-time user, I want to be guided through a short, skippable onboarding step after signing in so I can tell the AI which calendars are for work vs. personal and when I prefer to focus — without being blocked if I choose to skip.

#### Acceptance Criteria

1. WHEN a user signs in for the first time AND no `user_preferences` row exists for their `user_id`, THE system SHALL display the Onboarding_Screen before showing the main application view.
2. WHEN a user has already completed or skipped onboarding (a `user_preferences` row exists), THE system SHALL NOT show the Onboarding_Screen again.
3. WHEN the Onboarding_Screen is displayed, IT SHALL present a calendar-labeling step listing the user's existing Google Calendar names and allowing each to be tagged as "work" or "personal".
4. WHEN the Onboarding_Screen is displayed, IT SHALL present a focus-hours step allowing the user to select a start time and end time (HH:mm, 24-hour) for their Focus_Hours; the default SHALL be no focus hours selected.
5. WHEN the user clicks "Save & Continue", THE system SHALL upsert a `user_preferences` row with `calendar_labels` set to a JSON object mapping calendar name to label, and `focus_hours` set to `{ "start": "HH:mm", "end": "HH:mm" }` or `null` if none was selected.
6. WHEN the user clicks "Skip", THE system SHALL upsert a `user_preferences` row with `calendar_labels` set to `{}` and `focus_hours` set to `null`, recording that onboarding was seen and dismissed.
7. WHEN the upsert fails, THE system SHALL log the error and allow the user to proceed to the main application view regardless — onboarding failure SHALL NOT block application access.

---

### Requirement 7: Preferences-Aware AI Prompt

**User Story:** As a user who has labeled my calendars and set focus hours, I want the AI to respect those preferences when generating suggestions so it does not recommend moving work meetings into personal time or scheduling during my focus window.

#### Acceptance Criteria

1. WHEN generating a suggestion, THE generate route SHALL query `user_preferences` for the current user before calling `generateSuggestion`.
2. WHEN a `user_preferences` row exists AND `calendar_labels` is non-empty, THE system SHALL pass the labels to `generateSuggestion` and include them in the AI prompt so the model knows which calendar names map to "work" or "personal".
3. WHEN a `user_preferences` row exists AND `focus_hours` is non-null, THE system SHALL pass the Focus_Hours range to `generateSuggestion` and include it in the AI prompt as a scheduling constraint (e.g. "Do not propose moving any event into the focus window HH:mm–HH:mm").
4. WHEN no `user_preferences` row exists OR both `calendar_labels` and `focus_hours` are empty/null, THE system SHALL call `generateSuggestion` with no preference arguments and the prompt SHALL fall back to the current generic behavior — suggestion generation SHALL NOT be blocked.
5. WHEN the `user_preferences` query itself fails, THE system SHALL log the error and proceed with generic prompt behavior — suggestion generation SHALL NOT be blocked by a preferences-fetch failure.

---

### Requirement 8: dismissed_patterns Supabase Table

**User Story:** As a developer, I want a `dismissed_patterns` table in Supabase so that normalized rejected-event titles can be stored per user and queried efficiently during suggestion generation.

#### Acceptance Criteria

1. WHEN the migration is applied, THE system SHALL have a `dismissed_patterns` table with columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `event_title_pattern TEXT NOT NULL`, and `dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
2. WHEN a user's auth account is deleted, THE system SHALL cascade-delete all their `dismissed_patterns` rows.
3. WHERE queries against `dismissed_patterns` filter by `user_id` and `dismissed_at` range, AN index on `(user_id, dismissed_at)` SHALL exist to keep those queries performant.

---

### Requirement 9: Record Dismissed Pattern on Rejection

**User Story:** As a user who clicks "Reject" on a suggestion, I want that suggestion's title to be quietly recorded so the AI stops repeatedly proposing the same kind of change.

#### Acceptance Criteria

1. WHEN a user posts `POST /api/suggestions/[id]/reject`, THE reject route SHALL, after marking the suggestion `rejected`, fetch the suggestion's `title` field from Supabase.
2. WHEN the suggestion's title has been retrieved, THE system SHALL normalize it (lowercase, trim whitespace) and insert a row into `dismissed_patterns` with `user_id`, `event_title_pattern` (the Normalized_Title), and `dismissed_at` (current timestamp).
3. WHEN the `dismissed_patterns` insert fails, THE system SHALL log the error with prefix `[suggestions/reject]` but SHALL still return HTTP 200 `{ success: true }` — a pattern-recording failure SHALL NOT cause the rejection itself to fail.
4. WHEN the suggestion row cannot be fetched (e.g. it was already deleted), THE system SHALL log a warning with prefix `[suggestions/reject]` and skip the pattern insert, but SHALL still proceed with the status update if it succeeded.

---

### Requirement 10: Pre-Generation Dismissed-Pattern Fetch

**User Story:** As a user who has dismissed suggestions, I want the system to load my recent dismissals before generating a new proposal so it can skip titles I have already rejected.

#### Acceptance Criteria

1. WHEN generating a new suggestion, THE generate route SHALL query `dismissed_patterns` for the current user WHERE `dismissed_at >= now() - INTERVAL '14 days'`, after the duplicate-event-id check and before calling `generateSuggestion`.
2. WHEN the `dismissed_patterns` query fails, THE system SHALL log the error with prefix `[suggestions/generate]` and proceed with an empty dismissed list — suggestion generation SHALL NOT be blocked by this failure.
3. WHEN the query succeeds, THE system SHALL pass the list of `event_title_pattern` strings to the post-generation suppression check (Requirement 11).

---

### Requirement 11: Post-Generation Suppression Check

**User Story:** As a user who has already dismissed suggestions about a particular event, I want a newly generated proposal to be silently dropped if its title matches a pattern I recently rejected, rather than surfacing it again.

#### Acceptance Criteria

1. WHEN the AI returns a proposal, THE system SHALL normalize the proposal's `title` field (lowercase, trim) and compare it against each Dismissed_Pattern in the list from Requirement 10.
2. WHEN the Normalized_Title exactly matches any Dismissed_Pattern, THE system SHALL log `[suggestions/generate] Skipped — matches dismissed pattern: "<title>"` and return HTTP 200 `{ message: "skipped — matches dismissed pattern" }` without inserting the suggestion into Supabase.
3. WHEN the Normalized_Title does NOT match any Dismissed_Pattern, THE system SHALL proceed normally to the Supabase insert step.
4. WHEN a Dismissed_Pattern was recorded more than 14 days ago, IT SHALL NOT be included in the comparison — enforced by the `dismissed_at` filter in Requirement 10 — and after the Suppression_Window expires similar suggestions may reappear.
5. WHEN the dismissed list is empty (no recent dismissals or the query failed), THE suppression check SHALL be a no-op and the proposal SHALL proceed to insert.

