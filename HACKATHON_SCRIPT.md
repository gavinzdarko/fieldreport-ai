# FieldReport AI Hackathon Talk Track

## One-Line Pitch

FieldReport AI is an evidence-grounded incident documentation agent that turns bodycam, dispatch, and officer notes into a department-aware DUI report with citations, flags, review, approval, and audit trail.

## 30-Second Opening

FieldReport AI is built for the Company Brain track.

The core idea is that every police department has a brain. It lives in past reports, supervisor feedback, policy emails, Slack messages, and SOPs. But when an officer writes a report at 2 AM, that knowledge is scattered and hard to use.

Our demo shows a DUI report workflow where the app ingests department knowledge, processes current-case evidence, retrieves department-specific requirements, drafts a citation-backed report, flags issues, and lets an officer and supervisor review it with a full audit trail.

## Problem

DUI reports are repetitive, but the details are legally important.

An officer needs exact SFST clue counts, Miranda time, the officer who gave Miranda, the suspect response, a full vehicle description, tow details, charges, and department-specific supervisor preferences.

If those details are missing, the report gets kicked back or creates legal risk.

The problem is not just writing. The problem is combining current evidence with the department's institutional knowledge.

## Why This Is Company Brain

Say this clearly:

The department brain is load-bearing. If we remove it, the report gets worse.

Without the brain, the draft says generic things like "failed field sobriety tests" or "Miranda rights were read."

With the brain, it knows Sgt. Rodriguez wants exact SFST clue counts like HGN 6/6, Walk and Turn 4/8, and One Leg Stand 3/4. It knows Legal Division requires exact Miranda time, officer, and quoted suspect response. It knows Metro PD reports include full vehicle descriptions and both CVC 23152a and 23152b charges.

That is the difference between generic AI text and a department-approvable report.

## What We Built

We built a localhost MVP with:

- Hyperspell-style ingestion of past reports, supervisor feedback, and policies.
- Nia-style retrieval for department requirements and past report patterns.
- Tensorlake-style stateful evidence processing with durable case memory.
- InsForge-ready database path through `DATABASE_URL`, with local fallback.
- OpenAI-compatible drafting through a provider boundary.
- Citation-backed report output.
- Contradiction and missing-info flags.
- Officer edit, supervisor approval, and audit trail.
- A with-brain versus without-brain comparison to prove the company brain matters.

## Demo Setup

Open:

```text
http://localhost:3000/demo
```

Say:

This is one DUI case: MPD-2025-0519. The evidence sources are bodycam, dispatch, and officer notes. The department brain contains prior DUI reports, Sgt. Rodriguez feedback, Legal Division policy guidance, and policy documents.

## Live Demo Flow

### 1. Run The Demo

Click:

```text
Run full demo
```

Say:

This runs the full pipeline: department brain initialization, evidence processing, case memory update, Nia retrieval, report drafting, flags, and audit trail creation.

### 2. Explain Hyperspell

Point to the ingestion/status area.

Say:

Hyperspell is the ingestion layer. In a real deployment, this is where past reports from Google Drive, supervisor feedback from Slack, and policy emails from Gmail would enter the system.

For the hackathon demo, we use local fallback data with the same adapter interface so the demo is reliable.

### 3. Explain Tensorlake

Point to bodycam and dispatch processing.

Say:

Tensorlake is the stateful evidence processing layer. The important moment is that bodycam is processed first, then dispatch is added second to the same case memory. We are not recomputing everything from scratch.

That matters because real cases evolve as more evidence arrives.

### 4. Explain Nia

Point to the Nia context / brain panel.

Say:

Nia is the retrieval layer. Before drafting, the agent asks questions like:

- What does Sgt. Rodriguez require in DUI reports?
- What do past Metro PD DUI reports look like?
- What does Miranda policy require?

Those results shape the draft, but past reports are only used for style and requirements, not facts.

### 5. Show With-Brain vs Without-Brain

Say:

This is the key Company Brain proof.

Without the department brain, the draft is generic. With the brain, it includes exact SFST clue counts, Miranda details, full vehicle description, tow details, and the correct DUI charges.

The brain is not decoration. It changes the output.

### 6. Show Flags

Say:

The app flags two case issues.

First, dispatch says hit-and-run with property damage, but bodycam shows the driver was still at the scene.

Second, the driver says he came from "Mike's place on 5th" and had "a couple drinks", but the exact address and exact drink count are missing.

The app does not silently resolve those. It surfaces them for human review.

### 7. Open Review

Click:

```text
Open review workbench
```

Say:

This is the report review screen. The officer can inspect the draft, citations, flags, timeline, brain context, and audit trail.

### 8. Show Citations

Click a citation badge in the report.

Say:

Every factual claim links back to evidence. The point is not to hide AI output. The point is to make every claim inspectable.

### 9. Show Timeline

Click:

```text
Timeline
```

Say:

The timeline combines bodycam and dispatch chronologically. This helps explain why the hit-and-run classification conflicts with driver-at-scene evidence.

### 10. Show Brain Context

Click:

```text
Brain Context
```

Say:

This shows the Nia retrieval results that shaped the report. It gives the reviewer visibility into what department knowledge the agent used.

### 11. Show Audit Trail

Click:

```text
Audit Trail
```

Say:

The audit trail records what the AI drafted, what the human changed, and who approved it. The latest version shows per-field diffs, not just a vague "report changed" event.

For public-safety workflows, accountability is a product requirement, not a nice-to-have.

### 12. Show Roles

Switch to:

```text
Officer Chen
```

Say:

Officer Chen can review and edit, but cannot approve the final report.

Switch to:

```text
Sgt. Rodriguez
```

Say:

Sgt. Rodriguez can edit and approve. This is a lightweight mock of department permissions.

## Sponsor Integration Explanation

Say:

We optimized for a working demo first, but kept clean adapter boundaries.

- `hyperspell.ts` handles ingestion and search.
- `nia.ts` handles department-brain indexing and retrieval.
- `tensorlake.ts` handles stateful evidence processing.
- `insforge.ts` documents the InsForge/Postgres path.
- `agent.ts` owns the drafting provider boundary.

If a sponsor API key is present, the wrapper can call the real provider. If not, it falls back locally with the same method signature.

That is why the demo works end-to-end without API keys, but the architecture is still swappable.

## Technical Architecture

Say:

The app is built with Next.js 14 App Router, TypeScript, Tailwind, Drizzle, and a Postgres-ready database layer.

The sample data is embedded for deployment readiness, so the app can run on Vercel without relying on filesystem reads.

The report drafting uses an OpenAI-compatible provider boundary. If `OPENAI_API_KEY` is missing, it uses a deterministic local draft so the demo never breaks.

## Closing

Say:

FieldReport AI is not just a report generator. It is a department-aware documentation workflow.

It combines current evidence with institutional knowledge, proves the company brain changes the output, keeps citations attached to factual claims, flags issues instead of hiding them, and preserves human review through audit and approval.

## If You Only Have 20 Seconds

FieldReport AI drafts DUI reports from bodycam, dispatch, and officer notes. The company brain is built from past reports, supervisor feedback, and policies. With that brain, the report includes department-specific requirements like exact SFST clue counts, Miranda documentation, vehicle details, and charges. Without it, the report is generic. The demo shows evidence processing, Nia retrieval, a cited report, flags, review, and audit trail.
