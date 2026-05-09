"use client";

import type { AuditRecord } from "@/lib/types";

function compact(value: string | null) {
  if (!value) return "None";
  // Try to parse JSON and show human-readable version
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") return parsed.length > 200 ? parsed.slice(0, 200) + "..." : parsed;
    if (Array.isArray(parsed)) return parsed.map((item: any) => typeof item === "string" ? item : JSON.stringify(item)).join(", ").slice(0, 200);
    return JSON.stringify(parsed, null, 1).slice(0, 200);
  } catch {
    return value.length > 200 ? value.slice(0, 200) + "..." : value;
  }
}

function actorBadge(actor: string, action: string) {
  if (actor === "ai" || actor.includes("FieldReport") || action === "ai_drafted") {
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">🤖 AI Drafted</span>;
  }
  if (action === "human_edit" || action === "edited") {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">👤 Human Edited</span>;
  }
  if (action === "approved") {
    return <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">✅ Approved</span>;
  }
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">{actor}</span>;
}

function fieldName(field: string | null) {
  if (!field) return "report";
  const names: Record<string, string> = {
    narrative: "📝 Narrative",
    charges: "⚖️ Charges",
    property: "📦 Property & Evidence",
    miranda_documentation: "⚖️ Miranda Documentation",
    vehicle_description: "🚗 Vehicle Description",
    policy_compliance: "📋 Policy Compliance",
    status: "📊 Status",
    report: "📄 Full Report"
  };
  return names[field] || field;
}

export default function AuditTrailView({ audit }: { audit: AuditRecord[] }) {
  return (
    <div className="space-y-3">
      {audit.map((row) => (
        <article key={row.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {actorBadge(row.actor, row.action)}
              <span className="font-semibold text-gray-800">{fieldName(row.field)}</span>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{row.actor.includes("FieldReport") ? "FieldReport AI" : row.actor}</p>
              <p>{new Date(row.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Show the value that was set */}
          <div className="rounded-xl bg-gray-50 p-3">
            {row.action === "ai_drafted" && (
              <>
                <p className="mb-1 text-xs font-bold uppercase text-blue-600">AI generated:</p>
                <p className="break-words text-xs leading-5 text-gray-700">{compact(row.after)}</p>
                {row.evidence_ref && (
                  <p className="mt-2 text-xs text-gray-400">Source: {row.evidence_ref}</p>
                )}
              </>
            )}
            {row.action === "human_edit" && (
              <>
                {row.before && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-bold uppercase text-red-500">Before (AI version):</p>
                    <p className="break-words text-xs leading-5 text-gray-500 line-through decoration-red-300">{compact(row.before)}</p>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-green-600">After (human edit):</p>
                  <p className="break-words text-xs leading-5 text-gray-700">{compact(row.after)}</p>
                </div>
              </>
            )}
            {row.action === "approved" && (
              <p className="text-xs text-gray-700">
                Report approved by <span className="font-bold">{row.actor}</span>. Status changed from{" "}
                <span className="font-mono text-xs">{row.before || "draft"}</span> to{" "}
                <span className="font-bold font-mono text-xs">{row.after || "approved"}</span>.
              </p>
            )}
            {!["ai_drafted", "human_edit", "approved"].includes(row.action) && (
              <p className="text-xs text-gray-700">{compact(row.after)}</p>
            )}
          </div>
        </article>
      ))}
      {!audit.length && <p className="rounded-2xl bg-white/75 p-5 text-sm text-gray-500">No audit rows yet.</p>}
    </div>
  );
}
