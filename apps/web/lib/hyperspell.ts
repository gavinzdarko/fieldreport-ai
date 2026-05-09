import type { SearchResult } from "./types";
import { stableId } from "./utils";

type IngestedDoc = SearchResult;

const globalForHs = globalThis as unknown as { hyperspellDocs?: IngestedDoc[] };
const docs = globalForHs.hyperspellDocs ?? (globalForHs.hyperspellDocs = []);

function scoreDoc(query: string, doc: IngestedDoc) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const haystack = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

export async function hsIngest(title: string, content: string, source: string, metadata: Record<string, unknown> = {}) {
  // ── Try real Hyperspell API first ──
  if (process.env.HYPERSPELL_API_KEY) {
    try {
      const res = await fetch("https://api.hyperspell.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HYPERSPELL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, content, source, metadata })
      });
      if (res.ok) {
        // Also index locally so the demo works
      }
    } catch (err) {
      console.error("[Hyperspell] Real API ingest failed, falling back to local:", err);
    }
  }

  // ── Always index locally too ──
  const existing = docs.find((doc) => doc.title === title && doc.source === source);
  const doc: IngestedDoc = {
    id: existing?.id ?? stableId("hs"),
    title,
    content,
    source,
    tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [],
    metadata,
    score: 1
  };

  if (existing) {
    Object.assign(existing, doc);
  } else {
    docs.push(doc);
  }

  return {
    provider: process.env.HYPERSPELL_API_KEY ? "hyperspell+local" : "local",
    status: "ingested",
    doc
  };
}

export async function hsSearch(query: string) {
  // ── Try real Hyperspell API first ──
  if (process.env.HYPERSPELL_API_KEY) {
    try {
      const res = await fetch("https://api.hyperspell.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HYPERSPELL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, limit: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length) {
          return { provider: "hyperspell" as const, results: data.results };
        }
      }
    } catch (err) {
      console.error("[Hyperspell] Real API search failed, falling back to local:", err);
    }
  }

  // ── Fallback to local ──
  const results = docs
    .map((doc) => ({ ...doc, score: scoreDoc(query, doc) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    provider: process.env.HYPERSPELL_API_KEY ? ("hyperspell-fallback-local" as const) : ("local" as const),
    results
  };
}

export function hsStats() {
  return {
    count: docs.length,
    provider: process.env.HYPERSPELL_API_KEY ? "hyperspell+local" : "local"
  };
}

export function hsReset() {
  docs.length = 0;
}
