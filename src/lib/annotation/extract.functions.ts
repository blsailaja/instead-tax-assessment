import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { extractTaxCandidates } from "./extract.server";
export type { ExtractionCandidate } from "./extract.types";

const input = z.object({
  images: z.array(z.string()).min(1).max(4),
  fields: z
    .array(z.object({ id: z.string(), label: z.string(), path: z.string(), type: z.string() }))
    .max(300),
});

export const extractCandidates = createServerFn({ method: "POST" })
  .inputValidator((value) => input.parse(value))
  .handler(async ({ data }) => extractTaxCandidates(data));
