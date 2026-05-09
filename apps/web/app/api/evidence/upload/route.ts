import { NextRequest, NextResponse } from "next/server";
import { getCaseByNumber, seedCase } from "@/lib/db";
import { processEvidence } from "@/lib/tensorlake";
import type { EvidenceType } from "@/lib/types";
import { DEMO_CASE_NUMBER } from "@/lib/demo";
import { EVIDENCE } from "@/lib/sample-data";

function loadSampleEvidence(evidenceType: EvidenceType) {
  if (evidenceType === "bodycam") return EVIDENCE.bodycam;
  if (evidenceType === "dispatch") return EVIDENCE.dispatch;
  if (evidenceType === "officer-notes") return EVIDENCE["officer-notes"];
  throw new Error(`Unknown evidence type: ${evidenceType}`);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    caseId?: string;
    evidenceType?: EvidenceType;
    data?: unknown;
  };
  const caseId = body.caseId ?? DEMO_CASE_NUMBER;
  const evidenceType = body.evidenceType;
  if (!evidenceType) {
    return NextResponse.json({ error: "evidenceType is required" }, { status: 400 });
  }

  await seedCase(caseId);
  const result = await processEvidence(caseId, evidenceType, body.data ?? loadSampleEvidence(evidenceType));
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  const caseId = request.nextUrl.searchParams.get("caseId") ?? DEMO_CASE_NUMBER;
  const record = await getCaseByNumber(caseId);
  return NextResponse.json({ case: record, state: record?.evidence_json ?? null });
}
