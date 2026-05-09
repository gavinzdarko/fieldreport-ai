# FieldReport AI Hackathon Demo Script

## 30-Second Intro

FieldReport AI helps public-safety teams draft DUI incident reports from evidence while keeping the officer in control.

The app takes current-case evidence like bodycam transcripts, dispatch logs, and officer notes, then combines that with department-specific policy and historical report patterns. It produces a citation-backed draft, flags contradictions and missing information, and keeps an audit trail for AI-generated text, human edits, and supervisor approval.

For this MVP, we focused on one reliable happy path: a Metro PD DUI arrest case.

## Problem

DUI reports are high-stakes and repetitive, but they still require exact details.

An officer needs to include SFST clue counts, Miranda timing and response, vehicle details, tow information, charges, and department-specific supervisor preferences. Missing one detail can create legal or review problems.

At the same time, evidence arrives from different places: bodycam, dispatch, and handwritten officer notes. Today, the officer has to manually stitch all of that together.

FieldReport AI turns that scattered evidence into a structured, reviewable draft.

## What We Built

We built a localhost MVP with:

- Evidence ingestion for bodycam, dispatch, and officer notes.
- Stateful case processing so bodycam can be processed first and dispatch can extend the same case memory later.
- Department knowledge retrieval for Metro PD DUI patterns and Sgt. Rodriguez requirements.
- AI report drafting with citations on factual claims.
- Contradiction and missing-info flags.
- Review, edit, approval, and audit trail.
- Hardcoded demo roles: Officer Chen can edit, Sgt. Rodriguez can approve.

## Live Demo Flow

### 1. Open The Demo

Go to:

```text
http://localhost:3000/demo
```

Say:

This is the guided demo. Instead of showing a bunch of internal APIs, we made one button that runs the complete case flow.

### 2. Run The Full Demo

Click:

```text
Run full demo
```

Say:

The app is loading department knowledge, processing evidence, extending case memory, and generating a report draft.

The important part is that dispatch is not processed as a separate isolated file. It updates the same case state that bodycam created earlier.

### 3. Explain The Sponsor Pieces

Say:

We kept sponsor integrations behind clean adapters.

Nia is used for department-aware retrieval. In the demo, it retrieves things like Sgt. Rodriguez requiring SFST clue counts and full vehicle descriptions.

Hyperspell supports the ingestion story. We ingest prior reports, policy docs, and supervisor feedback into the department brain.

Tensorlake is represented by a stateful evidence processor. The MVP simulates the workflow locally, but preserves the same boundary: process evidence, get case state.

InsForge is represented through the database layer. We use `DATABASE_URL` as the Postgres path, with a local fallback so the demo works without blocking on SDK setup.

### 4. Point Out The Flags

Say:

The app catches two things that matter in this case.

First, dispatch classifies the call as hit-and-run with property damage, but bodycam shows the driver was still at the scene.

Second, the driver says he came from "Mike's place on 5th" and had "a couple drinks", but the exact address and exact drink count are missing.

The app does not silently fix those. It flags them for human review.

### 5. Open Review

Click:

```text
Open review workbench
```

Say:

This is where the officer or supervisor reviews the generated report. The draft has citation badges so the reviewer can trace claims back to evidence.

### 6. Show Citations

Click a citation badge in the report.

Say:

Every factual claim should point back to evidence. Clicking a citation shows the source reference and text.

This is important because the product is not trying to replace officer judgment. It is trying to make the draft faster and easier to verify.

### 7. Show Timeline

Click:

```text
Timeline
```

Say:

The timeline combines dispatch and bodycam events chronologically. This helps the reviewer see what happened and where contradictions came from.

### 8. Show Audit Trail

Click:

```text
Audit Trail
```

Say:

The audit trail records AI-drafted fields, human edits, and final approval. That is critical for accountability in public-safety workflows.

### 9. Show Roles

Switch user to:

```text
Officer Chen
```

Say:

Officer Chen can review and edit, but cannot approve the final report.

Switch user to:

```text
Sgt. Rodriguez
```

Say:

Sgt. Rodriguez can approve the final report. This mirrors a lightweight version of department workflow permissions.

## Technical Architecture

Say:

The app is built with Next.js 14 App Router, TypeScript, Tailwind, Drizzle, and a Postgres-ready database layer.

The core design decision was to keep provider boundaries clean:

- `nia.ts` handles Nia-style retrieval.
- `hyperspell.ts` handles ingestion/search.
- `tensorlake.ts` handles stateful evidence processing.
- `insforge.ts` documents the database path.
- `agent.ts` handles report drafting through an OpenAI-compatible provider.

If a real sponsor API is not available, the adapter falls back locally with the same interface. That kept the demo reliable while preserving swap-in points.

## Why This Is Useful

Say:

The key value is not just generating text. The value is structured evidence processing plus department-aware drafting plus review controls.

For a real department, this could reduce report drafting time while making required details easier to catch before supervisor review or legal review.

## Closing

Say:

FieldReport AI shows how AI can support public-safety documentation without hiding the source of facts or removing human accountability.

The MVP demonstrates the full path: ingest department knowledge, process evidence, update case memory, draft a cited report, flag issues, edit, approve, and audit the workflow.

## Short Version If Time Is Tight

FieldReport AI drafts DUI reports from bodycam, dispatch, and officer notes. It retrieves department-specific requirements, processes evidence into a timeline, drafts a cited report, flags contradictions and missing info, and supports officer edit plus supervisor approval with audit trail.

The demo uses local adapters for sponsor APIs where needed, but the boundaries are clean so Nia, Hyperspell, Tensorlake, and InsForge can be swapped in later.
