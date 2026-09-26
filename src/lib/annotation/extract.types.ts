export type ExtractionCandidate = {
  fieldId: string;
  path: string;
  value: string | number | boolean | null;
  confidence: number;
  evidence: string;
  page: number;
};
