/**
 * Tax Form Annotation Spec (TFAS) v1.0.0
 * All geometry is in PDF points (1/72 in), origin at the TOP-LEFT of each page.
 */

export type Rect = { x: number; y: number; width: number; height: number };

export type FieldType = "text" | "currency" | "checkbox" | "comb" | "multiline" | "date";

/** Where a value comes from. `path` uses the TFAS path syntax (see resolve.ts). */
export type Source =
  | { kind: "path"; path: string; default?: unknown }
  | { kind: "template"; template: string }
  | {
      kind: "aggregate";
      op: "sum" | "count" | "min" | "max" | "join";
      path: string;
      separator?: string;
    }
  | { kind: "constant"; value: unknown };

export type ConditionOp = "eq" | "neq" | "in" | "exists" | "truthy" | "gt" | "lt";
export type Condition = { path: string; op: ConditionOp; value?: unknown };

export type Format =
  | { kind: "text"; case?: "upper" | "lower" | "title"; maxLength?: number }
  | {
      kind: "currency";
      decimals?: number;
      thousandsSeparator?: string;
      negativeStyle?: "minus" | "parentheses";
      zero?: "blank" | "zero" | "dash";
      symbol?: string;
    }
  | { kind: "mask"; pattern: string; optionalTail?: boolean }
  | { kind: "date"; pattern: string }
  | { kind: "digits" }
  | { kind: "checkbox"; checkedWhen: { op: ConditionOp; value?: unknown }; mark?: "x" | "check" };

export type Style = {
  fontFamily?: "sans" | "serif" | "mono";
  fontSize?: number;
  minFontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  padding?: { x: number; y: number };
  overflow?: "shrink" | "clip" | "error";
  letterSpacing?: number;
};

export type Field = {
  id: string;
  label: string;
  line?: string | null;
  page: number;
  rect: Rect;
  type: FieldType;
  source: Source;
  format?: Format;
  style?: Style;
  condition?: Condition;
  comb?: { cells: number };
  pdfFieldName?: string;
  notes?: string;
};

export type Page = { index: number; width: number; height: number; image?: string };

export type Calibration = {
  offsetX: number; // pt, positive moves print right
  offsetY: number; // pt, positive moves print down
  scaleX: number; // 1 = 100%
  scaleY: number;
  printableMargin: number; // pt from each edge the printer cannot reach
};

export type Template = {
  specVersion: string;
  form: {
    id: string;
    name: string;
    authority?: string;
    taxYear?: number;
    revision?: string;
    omb?: string;
    source?: string;
  };
  units: "pt";
  origin: "top-left";
  pages: Page[];
  defaults?: { style?: Style };
  calibration?: Calibration;
  fields: Field[];
};

export const DEFAULT_CALIBRATION: Calibration = {
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
  printableMargin: 18,
};
