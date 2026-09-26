import type { Calibration, Field, Rect, Style, Template } from "./types";
import { DEFAULT_CALIBRATION } from "./types";
import { evalCondition, resolveSource } from "./resolve";
import { formatValue } from "./format";

export type Severity = "error" | "warning" | "info";
export type IssueCode =
  | "missing-value"
  | "format-error"
  | "overflow"
  | "comb-length"
  | "off-page"
  | "outside-printable"
  | "overlap-field"
  | "overlap-ink"
  | "bad-path"
  | "tiny-box";
export type Issue = { code: IssueCode; severity: Severity; message: string };

export type Measure = (
  text: string,
  fontSize: number,
  family: NonNullable<Style["fontFamily"]>,
) => number;

/** Rough metrics (avg glyph width / em) — PDF export passes real font metrics instead. */
export const approxMeasure: Measure = (text, size, family) =>
  text.length * size * (family === "mono" ? 0.6 : family === "serif" ? 0.5 : 0.53);

export type Rendered = {
  field: Field;
  style: Required<Omit<Style, "padding">> & { padding: { x: number; y: number } };
  hidden: boolean;
  text: string | null;
  checked?: boolean;
  fontSize: number;
  cells?: string[];
  issues: Issue[];
};

const BASE: Rendered["style"] = {
  fontFamily: "sans",
  fontSize: 9,
  minFontSize: 6,
  color: "#0b1f4d",
  align: "left",
  verticalAlign: "middle",
  padding: { x: 2, y: 1 },
  overflow: "shrink",
  letterSpacing: 0,
};

export function mergeStyle(t: Template, f: Field): Rendered["style"] {
  return { ...BASE, ...(t.defaults?.style ?? {}), ...(f.style ?? {}) } as Rendered["style"];
}

export function layoutField(
  t: Template,
  f: Field,
  data: unknown,
  measure: Measure = approxMeasure,
): Rendered {
  const style = mergeStyle(t, f);
  const issues: Issue[] = [];
  const base: Rendered = {
    field: f,
    style,
    hidden: false,
    text: null,
    fontSize: style.fontSize,
    issues,
  };
  let visible = true;
  try {
    visible = evalCondition(f.condition, data);
  } catch (e) {
    issues.push({ code: "bad-path", severity: "error", message: (e as Error).message });
  }
  if (!visible) return { ...base, hidden: true };

  let res: { value: unknown; missing: boolean };
  try {
    res = resolveSource(f.source, data);
  } catch (e) {
    issues.push({ code: "bad-path", severity: "error", message: (e as Error).message });
    return base;
  }
  if (res.missing && f.type !== "checkbox")
    issues.push({ code: "missing-value", severity: "info", message: "No value in data set" });

  const fr = formatValue(res.value, f.format);
  if (fr.error) issues.push({ code: "format-error", severity: "warning", message: fr.error });
  if (f.type === "checkbox") return { ...base, checked: !!fr.checked };

  const text = fr.text;
  if (text == null) return base;

  const inner = f.rect.width - style.padding.x * 2;
  if (f.type === "comb" && f.comb) {
    const chars = text.split("");
    if (chars.length > f.comb.cells)
      issues.push({
        code: "comb-length",
        severity: "error",
        message: `${chars.length} chars for ${f.comb.cells} cells`,
      });
    return { ...base, text, cells: chars.slice(0, f.comb.cells) };
  }

  let size = style.fontSize;
  const w = () => measure(text, size, style.fontFamily) + style.letterSpacing * text.length;
  if (w() > inner) {
    if (style.overflow === "shrink") {
      while (w() > inner && size > style.minFontSize)
        size = Math.max(style.minFontSize, size - 0.25);
    }
    if (w() > inner)
      issues.push({
        code: "overflow",
        severity: style.overflow === "clip" ? "warning" : "error",
        message: `Text is wider than the box (${Math.round(w())}pt > ${Math.round(inner)}pt)`,
      });
  }
  return { ...base, text, fontSize: size };
}

export function intersect(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function applyCalibration(r: Rect, c: Calibration = DEFAULT_CALIBRATION): Rect {
  return {
    x: r.x * c.scaleX + c.offsetX,
    y: r.y * c.scaleY + c.offsetY,
    width: r.width * c.scaleX,
    height: r.height * c.scaleY,
  };
}

/** Geometry checks that don't depend on data. `inkRatio` = share of dark pixels under box (0–1). */
export function geometryIssues(
  t: Template,
  f: Field,
  opts: { calibration?: Calibration; inkRatio?: number } = {},
): Issue[] {
  const issues: Issue[] = [];
  const page = t.pages[f.page];
  const cal = opts.calibration ?? t.calibration ?? DEFAULT_CALIBRATION;
  if (!page)
    return [{ code: "off-page", severity: "error", message: `Page ${f.page + 1} does not exist` }];
  const r = applyCalibration(f.rect, cal);
  if (f.rect.width < 4 || f.rect.height < 4)
    issues.push({ code: "tiny-box", severity: "warning", message: "Box is smaller than 4pt" });
  if (r.x < 0 || r.y < 0 || r.x + r.width > page.width || r.y + r.height > page.height)
    issues.push({ code: "off-page", severity: "error", message: "Box extends past the page edge" });
  else {
    const m = cal.printableMargin;
    if (r.x < m || r.y < m || r.x + r.width > page.width - m || r.y + r.height > page.height - m)
      issues.push({
        code: "outside-printable",
        severity: "warning",
        message: `Inside the ${m}pt unprintable margin — most printers will clip it`,
      });
  }
  for (const o of t.fields) {
    if (o === f || o.page !== f.page) continue;
    const a = intersect(f.rect, o.rect);
    const smaller = Math.min(f.rect.width * f.rect.height, o.rect.width * o.rect.height);
    if (smaller > 0 && a / smaller > 0.15) {
      issues.push({ code: "overlap-field", severity: "error", message: `Overlaps "${o.label}"` });
      break;
    }
  }
  if (opts.inkRatio !== undefined && opts.inkRatio > 0.06)
    issues.push({
      code: "overlap-ink",
      severity: "warning",
      message: `Covers printed form content (${Math.round(opts.inkRatio * 100)}% ink)`,
    });
  return issues;
}

export function layoutTemplate(t: Template, data: unknown, measure?: Measure) {
  return t.fields.map((f) => layoutField(t, f, data, measure));
}
