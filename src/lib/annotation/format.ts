import type { Format } from "./types";
import { testOp } from "./resolve";

export type FormatResult = { text: string | null; checked?: boolean; error?: string };

function roundHalfAway(n: number, d: number) {
  const f = 10 ** d;
  return (Math.sign(n) * Math.round(Math.abs(n) * f)) / f;
}

export function formatCurrency(
  value: unknown,
  f: Extract<Format, { kind: "currency" }>,
): FormatResult {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[$,\s]/g, ""));
  if (Number.isNaN(n)) return { text: null, error: `"${String(value)}" is not a number` };
  const d = f.decimals ?? 0;
  const r = roundHalfAway(n, d);
  if (r === 0) {
    if (f.zero === "blank") return { text: null };
    if (f.zero === "dash") return { text: "-0-" };
  }
  const [int, frac] = Math.abs(r).toFixed(d).split(".");
  const sep = f.thousandsSeparator ?? ",";
  const body =
    (f.symbol ?? "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (frac ? "." + frac : "");
  if (r < 0) return { text: f.negativeStyle === "minus" ? "-" + body : `(${body})` };
  return { text: body };
}

export function applyMask(value: unknown, pattern: string, optionalTail = false): FormatResult {
  const chars = String(value)
    .replace(/[^A-Za-z0-9]/g, "")
    .split("");
  const slots = (pattern.match(/[#A*]/g) || []).length;
  if (chars.length > slots) return { text: null, error: `Too many characters for mask ${pattern}` };
  let out = "";
  let ci = 0;
  let lastFilled = 0;
  for (const p of pattern) {
    if (p === "#" || p === "A" || p === "*") {
      if (ci >= chars.length) {
        if (!optionalTail)
          return { text: null, error: `Not enough characters for mask ${pattern}` };
        break;
      }
      out += chars[ci++];
      lastFilled = out.length;
    } else out += p;
  }
  return { text: out.slice(0, lastFilled) };
}

export function formatDate(value: unknown, pattern: string): FormatResult {
  const d =
    value instanceof Date
      ? value
      : new Date(String(value) + (String(value).length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return { text: null, error: `"${String(value)}" is not a date` };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    text: pattern
      .replace("YYYY", String(d.getFullYear()))
      .replace("YY", String(d.getFullYear()).slice(2))
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate())),
  };
}

export function formatValue(value: unknown, format: Format | undefined): FormatResult {
  if (!format) {
    if (value == null || value === "") return { text: null };
    return { text: String(value) };
  }
  if (format.kind === "checkbox") {
    return { text: null, checked: testOp(value, format.checkedWhen.op, format.checkedWhen.value) };
  }
  if (value == null || value === "") return { text: null };
  switch (format.kind) {
    case "currency":
      return formatCurrency(value, format);
    case "mask":
      return applyMask(value, format.pattern, format.optionalTail);
    case "date":
      return formatDate(value, format.pattern);
    case "digits":
      return { text: String(value).replace(/\D/g, "") };
    case "text": {
      let s = String(value);
      if (format.case === "upper") s = s.toUpperCase();
      if (format.case === "lower") s = s.toLowerCase();
      if (format.case === "title") s = s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      if (format.maxLength && s.length > format.maxLength)
        return {
          text: s.slice(0, format.maxLength),
          error: `Truncated to ${format.maxLength} chars`,
        };
      return { text: s };
    }
  }
}
