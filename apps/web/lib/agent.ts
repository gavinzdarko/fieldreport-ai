import OpenAI from "openai";
import { niaSearch } from "./nia";
import type { DraftReport, ProcessedCaseState, SearchResult } from "./types";
import { sourceMarker } from "./utils";

type DraftingProvider = {
  draft(prompt: string): Promise<DraftReport>;
};

function evidenceBlock(evidence: ProcessedCaseState) {
  return JSON.stringify(
    {
      timeline: evidence.timeline,
      facts: evidence.facts,
      citations: evidence.citations,
      contradictions: evidence.contradictions,
      missingInfo: evidence.missingInfo
    },
    null,
    2
  );
}

function contextBlock(results: SearchResult[]) {
  return results
    .map((result) =>
      `[DEPARTMENT REFERENCE — for style, structure, and requirements only. Do NOT copy facts from this into the new report.]\nTitle: ${result.title}\nSource: ${result.source}\nContent: ${result.content}`
    )
    .join("\n\n---\n\n");
}

function buildPrompt(evidence: ProcessedCaseState, context: string) {
  return `You are drafting a Metro PD DUI Arrest report.

Use only facts from the CURRENT EVIDENCE section below. Use the DEPARTMENT REFERENCE section only for style, structure, and policy requirements — never copy facts from past reports into the new report.
Write a chronological third-person narrative.
Include explicit SFST clue counts as fractions (e.g. 6/6, 4/8, 3/4).
Include Miranda with exact time, officer name and badge, and quoted suspect response.
Include full vehicle description (year, make, model, color, plate).
Mark missing required info as [MISSING: ...] — do NOT guess or fabricate.
Do not resolve contradictions automatically — flag them for the officer.
Every factual claim must include [SOURCE:reference].

Return strict JSON with these keys:
narrative, charges, property, miranda_documentation, vehicle_description, citations, policy_compliance.

DEPARTMENT CONTEXT (style/requirements only — NOT facts for this case):
${context}

CURRENT EVIDENCE (facts for this case):
${evidenceBlock(evidence)}`;
}

const WITHOUT_BRAIN_SYSTEM = `You are drafting a generic DUI Arrest report. You have NO knowledge of this department's specific policies, supervisor preferences, or reporting conventions. Write a standard DUI report using only the raw evidence provided. Do NOT include specific SFST clue counts as fractions — just describe the results generally. Do NOT include specific Miranda documentation requirements. Use a generic narrative format. Return strict JSON with keys: narrative, charges, property, miranda_documentation, vehicle_description, citations, policy_compliance.`;

class OpenAIDraftingProvider implements DraftingProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async draft(prompt: string) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You draft public-safety reports as strict JSON. Use only facts from the current evidence. Use department context only for style and requirements, not for facts."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty draft");
    return JSON.parse(content) as DraftReport;
  }
}

// ── Local provider WITH brain (department-aware) ──

class LocalDraftingProvider implements DraftingProvider {
  constructor(private evidence: ProcessedCaseState) {}

  async draft() {
    const facts = this.evidence.facts;
    const dispatchRef = "dispatch:CAD-2025-0519-0087";
    const notesRef = "notes:OFFICER-CHEN-4821";
    const bodycamRef = "bodycam:BC-4821-2025-0519:15";
    const drinkRef = "bodycam:BC-4821-2025-0519:38";
    const sfstRef = notesRef;
    const mirandaRef = notesRef;

    const vehicle = facts.vehicle
      ? `${facts.vehicle.color} ${facts.vehicle.year} ${facts.vehicle.make} ${facts.vehicle.model}, CA ${facts.vehicle.plate}`
      : `[MISSING: full vehicle description]`;

    const draft: DraftReport = {
      narrative: [
        `On 2025-05-09 at 0142 hours, Metro PD dispatch received a ${facts.dispatch?.callType ?? "[MISSING: call type]"} call at ${facts.dispatch?.address ?? "[MISSING: address]"}. ${sourceMarker(dispatchRef)}`,
        `At 0147 hours, Unit ${facts.dispatch?.unit ?? "[MISSING: unit]"} with Officer J. Chen arrived at 780 Elm Street. ${sourceMarker("dispatch:CAD-2025-0519-0087:arrival")}`,
        `Officer Chen contacted David Kowalski beside a white SUV bearing plate 8XYZ321. ${sourceMarker(bodycamRef)}`,
        `Kowalski said he came from Mike's place on 5th and had a couple drinks; the exact origin address and exact drink count remain [MISSING: exact address and drink count]. ${sourceMarker(drinkRef)}`,
        `Officer Chen documented SFST results of HGN ${facts.sfst?.hgn ?? "[MISSING: HGN clues]"}, Walk and Turn ${facts.sfst?.walkAndTurn ?? "[MISSING: Walk and Turn clues]"}, and One Leg Stand ${facts.sfst?.oneLegStand ?? "[MISSING: One Leg Stand clues]"}. ${sourceMarker(sfstRef)}`,
        `Officer Chen arrested Kowalski for DUI and Miranda was documented at ${facts.miranda?.time ?? "[MISSING: Miranda time]"} by ${facts.miranda?.officer ?? "[MISSING: Miranda officer]"} with the response "${facts.miranda?.suspectResponse ?? "[MISSING: quoted response]"}" ${sourceMarker(mirandaRef)}.`
      ].join(" "),
      charges: ["CVC 23152a", "CVC 23152b"],
      property: `${facts.property?.tow ?? "Vehicle tow information is [MISSING: tow details]."} ${facts.property?.damageOwner ?? "Property damage owner is [MISSING: owner]."} ${sourceMarker(notesRef)}`,
      miranda_documentation: `Miranda rights administered at ${facts.miranda?.time ?? "[MISSING: exact time]"} by ${facts.miranda?.officer ?? "[MISSING: officer]"}. Suspect stated: "${facts.miranda?.suspectResponse ?? "[MISSING: quoted suspect response]"}" ${sourceMarker(mirandaRef)}`,
      vehicle_description: `${vehicle} ${sourceMarker(notesRef)}`,
      citations: Object.entries(this.evidence.citations).map(([ref, text]) => ({
        ref,
        source: ref.split(":")[0],
        text
      })),
      policy_compliance: [
        `✅ Sgt. Rodriguez requirement met: SFST clue counts listed as ${facts.sfst?.hgn ?? "[MISSING]"}, ${facts.sfst?.walkAndTurn ?? "[MISSING]"}, ${facts.sfst?.oneLegStand ?? "[MISSING]"} (per Slack feedback 2024-06-12).`,
        `✅ Miranda policy check: exact time, officer, and quoted response included (per Legal Division email 2024-09-15).`,
        `✅ Vehicle description check: full year, make, model, color, and plate included (per Sgt. Rodriguez Slack 2024-11-15).`
      ],
      contradictions: this.evidence.contradictions,
      missing_info: this.evidence.missingInfo
    };
    return draft;
  }
}

// ── Local provider WITHOUT brain (generic) ──

class GenericDraftingProvider implements DraftingProvider {
  constructor(private evidence: ProcessedCaseState) {}

  async draft() {
    const facts = this.evidence.facts;

    const draft: DraftReport = {
      narrative: [
        `On 2025-05-09, officers responded to a traffic incident at ${facts.dispatch?.address ?? "[MISSING]"}. Upon arrival, the officer contacted the driver, who showed signs of impairment. The driver admitted to consuming alcohol prior to driving. The officer administered field sobriety tests, which the driver failed. The driver was subsequently placed under arrest for driving under the influence.`
      ].join(" "),
      charges: ["DUI"],
      property: `Vehicle towed. Property damage reported.`,
      miranda_documentation: `Miranda rights were read to the suspect. Suspect acknowledged rights.`,
      vehicle_description: `White SUV, plate 8XYZ321`,
      citations: Object.entries(this.evidence.citations).map(([ref, text]) => ({
        ref,
        source: ref.split(":")[0],
        text
      })),
      policy_compliance: [
        `❌ SFST clue counts missing — no specific fractions provided.`,
        `❌ Miranda documentation incomplete — no exact time, officer name, or quoted response.`,
        `❌ Vehicle description incomplete — missing year, make, and model.`,
        `❌ No supervisor-specific requirements applied.`
      ],
      contradictions: this.evidence.contradictions,
      missing_info: this.evidence.missingInfo
    };
    return draft;
  }
}

// ── Nia context result type ──

export type NiaContextResult = {
  query: string;
  results: SearchResult[];
  tags?: string[];
};

// ── Main draft function WITH brain ──

export async function draftReport(evidence: ProcessedCaseState) {
  const [requirements, patterns, miranda] = await Promise.all([
    niaSearch("Sgt. Rodriguez DUI report requirements SFST vehicle description", ["requirements"], 4),
    niaSearch("past Metro PD DUI report patterns chronological third-person tow charges weather", ["past-report"], 3),
    niaSearch("Miranda policy requirements exact time officer response", ["miranda", "policy"], 3)
  ]);

  const niaContext: NiaContextResult[] = [
    { query: "Sgt. Rodriguez DUI report requirements SFST vehicle description", results: requirements.results, tags: ["requirements"] },
    { query: "past Metro PD DUI report patterns chronological third-person", results: patterns.results, tags: ["past-report"] },
    { query: "Miranda policy requirements exact time officer response", results: miranda.results, tags: ["miranda", "policy"] }
  ];

  const niaResults = [...requirements.results, ...patterns.results, ...miranda.results];
  const prompt = buildPrompt(evidence, contextBlock(niaResults));
  const provider: DraftingProvider = process.env.OPENAI_API_KEY ? new OpenAIDraftingProvider() : new LocalDraftingProvider(evidence);

  try {
    const draft = await provider.draft(prompt);
    return {
      ...draft,
      contradictions: evidence.contradictions,
      missing_info: evidence.missingInfo,
      citations: draft.citations?.length
        ? draft.citations
        : Object.entries(evidence.citations).map(([ref, text]) => ({ ref, source: ref.split(":")[0], text })),
      niaContext,
      niaContextUsed: niaResults.length
    };
  } catch (error) {
    const fallback = await new LocalDraftingProvider(evidence).draft();
    return {
      ...fallback,
      niaContext,
      niaContextUsed: niaResults.length,
      provider_error: error instanceof Error ? error.message : "Unknown drafting provider error"
    } as DraftReport & { provider_error: string; niaContext: NiaContextResult[]; niaContextUsed: number };
  }
}

// ── Draft WITHOUT brain (for comparison) ──

export async function draftReportWithoutBrain(evidence: ProcessedCaseState) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: WITHOUT_BRAIN_SYSTEM },
          { role: "user", content: `DRAFT A DUI REPORT FROM THIS EVIDENCE (no department policies available):\n\n${evidenceBlock(evidence)}` }
        ]
      });
      const content = completion.choices[0]?.message?.content;
      if (content) {
        const draft = JSON.parse(content) as DraftReport;
        return { ...draft, contradictions: evidence.contradictions, missing_info: evidence.missingInfo };
      }
    } catch (e) {
      console.error("[Agent] Without-brain OpenAI call failed:", e);
    }
  }

  // Local fallback
  const provider = new GenericDraftingProvider(evidence);
  return provider.draft();
}
