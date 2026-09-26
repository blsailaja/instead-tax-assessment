import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createRunIdFetch } from "@/lib/ai/run-id.server";
import type { ExtractionCandidate } from "./extract.types";

function parseCandidates(text: string): ExtractionCandidate[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as { candidates?: unknown } | unknown[];
  const rows = Array.isArray(parsed) ? parsed : parsed.candidates;
  if (!Array.isArray(rows)) throw new Error("AI returned no candidate list");
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    if (typeof r["fieldId"] !== "string" || typeof r["path"] !== "string") return [];
    const value = r["value"];
    if (!(value == null || ["string", "number", "boolean"].includes(typeof value))) return [];
    return [
      {
        fieldId: r["fieldId"],
        path: r["path"],
        value: value as string | number | boolean | null,
        confidence: Math.max(0, Math.min(1, Number(r["confidence"]) || 0)),
        evidence: typeof r["evidence"] === "string" ? r["evidence"].slice(0, 240) : "",
        page: Math.max(1, Math.round(Number(r["page"]) || 1)),
      },
    ];
  });
}

export async function extractTaxCandidates(input: {
  images: string[];
  fields: Array<{ id: string; label: string; path: string; type: string }>;
}) {
  const apiKey = process.env["AI_API_KEY"] || process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI extraction service is not configured for this project");
  const runFetch = createRunIdFetch();
  const provider = createOpenAI({
    baseURL: process.env["AI_GATEWAY_URL"] || "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}` },
    fetch: runFetch,
  });
  const fieldCatalog = JSON.stringify(input.fields);
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      'You extract candidate values from U.S. tax documents for a tax preparer\'s review. Never calculate missing values. Never infer an SSN or amount not visibly present. Match only to the supplied field catalog. Return JSON only as {"candidates":[{"fieldId":string,"path":string,"value":string|number|boolean|null,"confidence":number,"evidence":string,"page":number}]}. Confidence is 0 to 1. Evidence is a short visible label or line reference, never additional sensitive data.',
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Map visible tax values to this annotation field catalog. Omit uncertain or unmatched values. Use JSON.\n${fieldCatalog}`,
          },
          ...input.images.map((image) => ({ type: "image" as const, image })),
        ],
      },
    ],
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (!text.trim()) throw new Error("AI extraction returned an empty result");
  return parseCandidates(text);
}
