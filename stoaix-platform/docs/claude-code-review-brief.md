# STOAIX Platform Review Brief for Claude Code

## Purpose

This document is a briefing for Claude Code.

The goal is:

1. First, review the current codebase with a production-readiness mindset.
2. Then, propose and implement only the highest-signal fixes.
3. Do not expand scope with unnecessary new features.

This is not a generic code review request. The product is a real healthcare-clinic operations platform and the review should focus on operational reliability, not feature brainstorming.

## Business Context

STOAIX is positioned as:

- AI-powered Growth & Operations Partner for Healthcare Clinics
- Focus sectors: hair transplant, dental, medical aesthetics, cosmetic / plastic surgery
- Target users: clinic owners, managers, sales / call-center style teams
- Model: managed service plus software platform

This means the platform is not just a dashboard. It is supposed to help clinics manage:

- lead intake
- WhatsApp conversations
- AI chatbot interactions
- AI voice-agent interactions
- follow-up sequences
- lead stage management
- handoff to humans
- offers / proposals
- clinic-side workflow visibility

Important operational reality:

- Lost leads mean lost revenue.
- Silent failures are more dangerous than missing features.
- Reliability matters more than adding more integrations right now.

## Current Product Reality

The current product is closer to:

- controlled pilot / managed beta

It should not be evaluated as a self-serve SaaS product yet.

## Important Scope Clarifications

Please use these constraints when reviewing:

### 1. Appointment booking is optional

Appointment creation during chatbot or voice-agent conversations is not a universal requirement for every customer.

- Some customers may want it.
- Some customers may never use it.

So:

- appointment-booking issues are important
- but they are not global launch blockers for the whole platform unless the booking feature is enabled for a given tenant

### 2. GoHighLevel is not our source of truth

We are trying not to depend heavily on GoHighLevel.

Current practical use is mostly:

- WAGHL / WhatsApp messaging

We do not currently consider GHL pipeline sync a main product priority.

### 3. Supabase is the core operational system

Supabase is the real internal system of record for:

- lead storage
- lead stage management
- conversations
- handoff-related state
- clinic-side workflow tracking

If a customer later wants external CRM synchronization, we want that to be flexible and optional, not a mandatory product assumption.

### 4. Meta Cloud API is not active for customers right now

We have no active customer currently using Meta Cloud API in production.

That path may matter later, but it is not a current business-critical blocker.

### 5. SIP transfer is not fully wired yet

We have not yet fully connected customer SIP trunk / transfer flow.

So if you review voice handoff / call transfer:

- treat it as an unfinished area
- do not assume it is meant to be production-ready today
- but do evaluate whether the current architecture will support a proper future transfer implementation cleanly

## Architecture Summary

### Main components

- `dashboard/`: Next.js 14 admin / ops dashboard
- `supabase/functions/`: chat + WhatsApp edge functions
- `supabase/functions/_shared/chat-engine.ts`: shared chat logic
- `voice-agent/agent.py`: Python voice agent
- `sql/`: schema and migrations
- `n8n-workflows/`: follow-up / outreach / automation flows

### Practical stack

- Frontend: Next.js 14, React 18, TypeScript
- Backend/data/auth: Supabase
- AI voice: Python + LiveKit + OpenAI
- Automation: n8n
- WhatsApp: currently mostly via WAGHL / GHL messaging
- Internal operational state: Supabase

## What We Already Believe Is Actually Important

These are the main issues that appear real and worth reviewing deeply.

### A. Voice agent persistence / crash safety

This is currently one of the biggest risks.

Concern:

- voice call data appears to be saved mainly at disconnect / end-of-call
- if the worker crashes mid-call, transcript, extracted data, and possible handoff signal may be lost

Please verify this carefully and, if correct, propose the smallest robust fix.

### B. Lead scoring quality

We already suspect the current lead scoring is too naive.

Concern:

- score seems heavily based on field completeness
- it may not reflect actual lead quality, intent, urgency, or sales usefulness

Please review both:

- whether the current implementation is technically correct
- whether it is operationally useful for clinics

We do not need an overengineered ML system. We need a pragmatic scoring model that helps real teams prioritize.

### C. Observability / silent failure risk

We care a lot about:

- knowing when messages fail
- knowing when workflows fail
- knowing when integrations silently stop working

The managed-service model means hidden failures are dangerous.

Please review:

- logging
- failure visibility
- operational alerts
- retry / dead-letter style patterns
- places where the system may fail silently

### D. Idempotency / duplicate protection

Please review:

- webhook duplication risks
- repeated task execution risks
- duplicate message sending risks
- repeated lead / task mutations

We want pragmatic duplicate safety in critical flows.

## Issues That Matter, But Are Lower Priority Right Now

These should not dominate the review unless they are easier to fix than expected.

### 1. Appointment booking command parsing

Current booking parsing in chat appears fragile.

This matters only for tenants where booking is enabled.

Please:

- review it
- assess the actual risk
- suggest a safer path

But do not treat it as a universal blocker unless the code proves it affects all customers.

### 2. GHL pipeline sync

We are not currently prioritizing full GHL CRM pipeline synchronization.

Please do not recommend a large CRM sync project unless there is a simple fix with very high value.

### 3. Meta Cloud API hardening

This is not currently customer-critical.

Flag real security issues if found, but do not let this area dominate the review.

### 4. SIP transfer

Review architecture readiness, but do not judge current platform readiness mainly through unfinished transfer features.

## CSV Import Context

CSV import is mainly intended for:

- cold outreach
- legacy lead list import
- clinic ops visibility after import

Clinics should be able to:

- import leads
- manage them in the platform
- update lead stage in the internal kanban
- add proposals / offers

Current belief:

- CSV import may be acceptable for pilot-scale use
- but may need background-job hardening later for larger imports

Please evaluate this pragmatically.

Do not assume it is already broken.
Do not assume it is definitely production-safe either.

## Requested Review Style

Please review in this order:

1. Real blockers for controlled live / pilot use
2. High-signal reliability improvements
3. Lower-priority refactors
4. Things that are not worth touching right now

Avoid:

- feature creep
- speculative architecture redesign
- adding systems we do not need yet

Prefer:

- minimal targeted fixes
- operational safety
- preserving current direction

## Concrete Questions To Answer

Please answer these explicitly:

1. Is the current system viable for a controlled pilot with close operator oversight?
2. What are the top 3-5 code-level reliability risks?
3. Which issues are real blockers vs merely unfinished product areas?
4. Which fixes are worth doing immediately before further customer rollout?
5. Which issues should be deferred because they are not aligned with current business reality?

## Expected Deliverable

Please produce:

### Part 1. Review

- executive summary
- real blockers
- high risks
- medium risks
- items that are overblown / not urgent

### Part 2. Action plan

- immediate fixes worth doing now
- fixes safe to defer

### Part 3. Implementation

If there are clear, contained, high-value fixes, implement them directly.

Focus on:

- voice persistence safety
- lead scoring improvements
- observability / error visibility
- idempotency / duplicate safety

Only touch booking / GHL / Meta / SIP areas if the fixes are small and clearly justified.

## Final Instruction

Do not optimize for theoretical completeness.
Optimize for making this codebase safer and more usable for real clinic operations in the near term.
