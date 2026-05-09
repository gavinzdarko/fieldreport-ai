import type { SearchResult } from "./types";
import { getSampleReportFiles } from "./utils";
import { SUPERVISOR_FEEDBACK, POLICIES } from "./sample-data";
import { stableId } from "./utils";

const globalForNia = globalThis as unknown as { niaDocs?: SearchResult[] };
const docs = globalForNia.niaDocs ?? (globalForNia.niaDocs = []);

function score(query: string, doc: SearchResult, tags?: string[]) {
  const tagBoost = tags?.some((tag) => doc.tags.includes(tag)) ? 3 : 0;
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const haystack = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
  return terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), tagBoost);
}

function ensureLocalCorpus() {
  if (docs.length > 0) return;

  for (const report of getSampleReportFiles()) {
    niaIndex(`Past DUI report ${report.file}`, report.content, ["dui", "metro-pd", "past-report"], {
      source: report.file
    });
  }

  SUPERVISOR_FEEDBACK.forEach((item, index) => {
    niaIndex(`${item.source} from ${item.author} ${index + 1}`, item.content, ["dui", "feedback", "requirements"], {
      source: `sample-feedback:${index + 1}`,
      author: item.author,
      channel: "channel" in item ? item.channel : undefined
    });
  });

  niaIndex("Miranda policy", POLICIES.miranda, ["policy", "miranda", "dui"], {
    source: "miranda-policy.md"
  });
  niaIndex("SFST policy", POLICIES.sfst, ["policy", "sfst", "dui"], {
    source: "sfst-policy.md"
  });
}

export function niaIndex(title: string, content: string, tags: string[] = [], metadata: Record<string, unknown> = {}) {
  // ── Try real Nia API first if key is available ──
  if (process.env.NIA_API_KEY) {
    fetch("https://api.trynia.ai/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, content, tags, metadata })
    }).catch((err) => console.error("[Nia] Real API index failed:", err));
  }

  // ── Always index locally too so the demo works ──
  const existing = docs.find((doc) => doc.title === title);
  const doc: SearchResult = {
    id: existing?.id ?? stableId("nia"),
    title,
    content,
    source: String(metadata.source ?? "local"),
    tags,
    metadata,
    score: 1
  };

  if (existing) {
    Object.assign(existing, doc);
  } else {
    docs.push(doc);
  }

  return {
    provider: process.env.NIA_API_KEY ? "nia+local" : "local",
    status: "indexed",
    doc
  };
}

export async function niaSearch(query: string, tags?: string[], limit = 5) {
  // ── Try real Nia API first ──
  if (process.env.NIA_API_KEY) {
    try {
      const res = await fetch("https://api.trynia.ai/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, filters: tags ? { tags } : undefined, limit })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length) {
          return { provider: "nia" as const, query, results: data.results };
        }
      }
    } catch (err) {
      console.error("[Nia] Real API search failed, falling back to local:", err);
    }
  }

  // ── Fallback to local search ──
  ensureLocalCorpus();
  const results = docs
    .map((doc) => ({ ...doc, score: score(query, doc, tags) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    provider: process.env.NIA_API_KEY ? ("nia-fallback-local" as const) : ("local" as const),
    query,
    results
  };
}

export function niaStats() {
  ensureLocalCorpus();
  return {
    count: docs.length,
    provider: process.env.NIA_API_KEY ? "nia+local" : "local"
  };
}

export function niaReset() {
  docs.length = 0;
}
