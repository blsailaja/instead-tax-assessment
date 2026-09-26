import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Calibration, Field, Page, Template } from "./types";
import { DEFAULT_CALIBRATION } from "./types";
import { applyCalibration, layoutField, type Measure } from "./layout";

export function parsePageRange(input: string, count: number): number[] {
  const s = input.trim();
  if (!s || s.toLowerCase() === "all") return Array.from({ length: count }, (_, i) => i);
  const out = new Set<number>();
  for (const part of s.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid page range "${part.trim()}"`);
    const a = +m[1];
    const b = m[2] ? +m[2] : a;
    for (let p = Math.min(a, b); p <= Math.max(a, b); p++) {
      if (p < 1 || p > count) throw new Error(`Page ${p} is out of range (1–${count})`);
      out.add(p - 1);
    }
  }
  return [...out].sort((x, y) => x - y);
}

function hex(c: string) {
  const m = c.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return rgb(0.04, 0.12, 0.3);
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

type Fonts = Record<"sans" | "serif" | "mono", PDFFont>;

async function fonts(doc: PDFDocument): Promise<Fonts> {
  return {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
}

function stampField(
  page: PDFPage,
  t: Template,
  f: Field,
  data: unknown,
  F: Fonts,
  cal: Calibration,
) {
  const measure: Measure = (txt, size, fam) => F[fam].widthOfTextAtSize(txt, size);
  const r = layoutField(t, f, data, measure);
  if (r.hidden) return;
  const H = page.getHeight();
  const box = applyCalibration(f.rect, cal);
  const font = F[r.style.fontFamily];
  const color = hex(r.style.color);
  const sx = cal.scaleX;
  const size = r.fontSize * sx;
  if (f.type === "checkbox") {
    if (!r.checked) return;
    const s = Math.min(box.width, box.height) * 0.95;
    const w = F.sans.widthOfTextAtSize("X", s);
    page.drawText("X", {
      x: box.x + (box.width - w) / 2,
      y: H - box.y - box.height / 2 - s * 0.35,
      size: s,
      font: F.sans,
      color,
    });
    return;
  }
  if (r.text == null) return;
  const baseline = (() => {
    const pad = r.style.padding.y * cal.scaleY;
    if (r.style.verticalAlign === "top") return H - box.y - pad - size * 0.8;
    if (r.style.verticalAlign === "bottom") return H - box.y - box.height + pad + size * 0.2;
    return H - box.y - box.height / 2 - size * 0.35;
  })();
  if (r.cells && f.comb) {
    const cw = box.width / f.comb.cells;
    r.cells.forEach((ch, i) => {
      const w = font.widthOfTextAtSize(ch, size);
      page.drawText(ch, { x: box.x + cw * i + (cw - w) / 2, y: baseline, size, font, color });
    });
    return;
  }
  const w = font.widthOfTextAtSize(r.text, size) + r.style.letterSpacing * sx * r.text.length;
  const px = r.style.padding.x * sx;
  let x = box.x + px;
  if (r.style.align === "center") x = box.x + (box.width - w) / 2;
  if (r.style.align === "right") x = box.x + box.width - px - w;
  if (r.style.letterSpacing) {
    let cx = x;
    for (const ch of r.text) {
      page.drawText(ch, { x: cx, y: baseline, size, font, color });
      cx += font.widthOfTextAtSize(ch, size) + r.style.letterSpacing * sx;
    }
  } else page.drawText(r.text, { x, y: baseline, size, font, color });
}

export type ExportOptions = {
  template: Template;
  data: unknown;
  mode: "filled" | "overlay";
  pages: number[];
  sourceBytes?: ArrayBuffer | null;
  calibration?: Calibration;
};

export async function exportPdf(o: ExportOptions): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const F = await fonts(out);
  // Calibration is a printer correction → only applied to overlay prints.
  const cal = o.mode === "overlay" ? (o.calibration ?? DEFAULT_CALIBRATION) : DEFAULT_CALIBRATION;
  let srcPages: PDFPage[] = [];
  if (o.mode === "filled") {
    if (!o.sourceBytes) throw new Error("Source form PDF is not loaded");
    const src = await PDFDocument.load(o.sourceBytes, { ignoreEncryption: true });
    try {
      src.getForm().flatten();
    } catch {
      /* no AcroForm */
    }
    srcPages = await out.copyPages(src, o.pages);
  }
  o.pages.forEach((pi, k) => {
    const meta = o.template.pages[pi];
    const page =
      o.mode === "filled" ? out.addPage(srcPages[k]) : out.addPage([meta.width, meta.height]);
    for (const f of o.template.fields)
      if (f.page === pi) stampField(page, o.template, f, o.data, F, cal);
  });
  out.setTitle(`${o.template.form.name} — ${o.mode === "filled" ? "completed" : "print overlay"}`);
  out.setCreator("INSTEAD Form Studio");
  return out.save();
}

/** Calibration sheet: rulers, corner crosshairs, printable margin, and every box outline. */
export async function calibrationTestPdf(
  t: Template,
  pageIndex: number,
  cal: Calibration,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const F = await fonts(doc);
  const meta = t.pages[pageIndex];
  const p = doc.addPage([meta.width, meta.height]);
  const H = meta.height;
  const ink = rgb(0.05, 0.1, 0.25);
  const red = rgb(0.8, 0.15, 0.1);
  const m = cal.printableMargin;
  p.drawRectangle({
    x: m,
    y: m,
    width: meta.width - 2 * m,
    height: H - 2 * m,
    borderColor: red,
    borderWidth: 0.5,
    borderDashArray: [3, 3],
  });
  for (let x = 0; x <= meta.width; x += 9) {
    const long = x % 72 === 0;
    p.drawLine({
      start: { x, y: H - m },
      end: { x, y: H - m - (long ? 12 : x % 36 === 0 ? 8 : 4) },
      thickness: 0.4,
      color: ink,
    });
    if (long && x)
      p.drawText(`${x / 72}in`, { x: x + 1, y: H - m - 20, size: 6, font: F.mono, color: ink });
  }
  for (let y = 0; y <= H; y += 9) {
    const long = y % 72 === 0;
    p.drawLine({
      start: { x: m, y: H - y },
      end: { x: m + (long ? 12 : y % 36 === 0 ? 8 : 4), y: H - y },
      thickness: 0.4,
      color: ink,
    });
  }
  const cross = (cx: number, cy: number) => {
    p.drawLine({
      start: { x: cx - 10, y: H - cy },
      end: { x: cx + 10, y: H - cy },
      thickness: 0.6,
      color: red,
    });
    p.drawLine({
      start: { x: cx, y: H - cy - 10 },
      end: { x: cx, y: H - cy + 10 },
      thickness: 0.6,
      color: red,
    });
    p.drawCircle({ x: cx, y: H - cy, size: 4, borderColor: red, borderWidth: 0.6 });
  };
  const c = (x: number, y: number) => applyCalibration({ x, y, width: 0, height: 0 }, cal);
  [
    [72, 72],
    [meta.width - 72, 72],
    [72, H - 72],
    [meta.width - 72, H - 72],
  ].forEach(([x, y]) => {
    const q = c(x, y);
    cross(q.x, q.y);
  });
  const s = c(144, H / 2);
  p.drawLine({
    start: { x: s.x, y: H - s.y },
    end: { x: s.x + 144 * cal.scaleX, y: H - s.y },
    thickness: 1,
    color: ink,
  });
  p.drawText("This line must measure exactly 2.00 in (50.8 mm)", {
    x: s.x,
    y: H - s.y - 12,
    size: 8,
    font: F.sans,
    color: ink,
  });
  p.drawText(
    `Calibration  offset ${cal.offsetX.toFixed(1)}, ${cal.offsetY.toFixed(1)} pt   scale ${(cal.scaleX * 100).toFixed(1)}% × ${(cal.scaleY * 100).toFixed(1)}%   — print at 100% / "Actual size"`,
    { x: s.x, y: H - s.y - 26, size: 7, font: F.mono, color: ink },
  );
  for (const f of t.fields) {
    if (f.page !== pageIndex) continue;
    const r = applyCalibration(f.rect, cal);
    p.drawRectangle({
      x: r.x,
      y: H - r.y - r.height,
      width: r.width,
      height: r.height,
      borderColor: rgb(0.1, 0.45, 0.8),
      borderWidth: 0.4,
    });
  }
  return doc.save();
}

export type ImportedForm = { bytes: ArrayBuffer; pages: Page[]; fields: Field[]; name: string };

/** Render a source PDF (client only) and turn its AcroForm widgets into starter annotations. */
export async function importPdf(file: File): Promise<ImportedForm> {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const bytes = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  const pages: Page[] = [];
  const fields: Field[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const vp1 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await pg.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    pages.push({
      index: i - 1,
      width: vp1.width,
      height: vp1.height,
      image: canvas.toDataURL("image/png"),
    });
    const annots = (await pg.getAnnotations()) as Array<{
      subtype: string;
      fieldType?: string;
      fieldName?: string;
      rect: number[];
      alternativeText?: string;
      checkBox?: boolean;
      comb?: boolean;
      maxLen?: number;
    }>;
    let n = 0;
    for (const a of annots) {
      if (a.subtype !== "Widget" || !a.rect) continue;
      const [x1, y1, x2, y2] = a.rect;
      const isBox = a.fieldType === "Btn";
      const id = `p${i}.${(a.fieldName || "field").replace(/[^\w]+/g, "_")}_${n++}`;
      fields.push({
        id,
        label: a.alternativeText || a.fieldName || id,
        page: i - 1,
        rect: {
          x: +x1.toFixed(2),
          y: +(vp1.height - y2).toFixed(2),
          width: +(x2 - x1).toFixed(2),
          height: +(y2 - y1).toFixed(2),
        },
        type: isBox ? "checkbox" : a.comb && a.maxLen ? "comb" : "text",
        source: { kind: "path", path: id.replace(/\./g, "_") },
        format: isBox ? { kind: "checkbox", checkedWhen: { op: "truthy" } } : undefined,
        comb: a.comb && a.maxLen ? { cells: a.maxLen } : undefined,
        pdfFieldName: a.fieldName,
      });
    }
  }
  return { bytes, pages, fields, name: file.name.replace(/\.pdf$/i, "") };
}

export function download(bytes: Uint8Array | string, name: string, type: string) {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
