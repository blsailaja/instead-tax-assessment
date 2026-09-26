import type { Condition, Source } from "./types";

/**
 * TFAS path syntax
 *   a.b.c              nested keys
 *   a[0].b / a[-1]     array index (negative = from end)
 *   a[*].b             wildcard → array of all matches
 *   a[?type=W2].b      filter array items where item.type == "W2"
 *   a["odd key"]       quoted key
 */
type Token =
  | { t: "key"; k: string }
  | { t: "index"; i: number }
  | { t: "wild" }
  | { t: "filter"; k: string; v: string };

export class PathError extends Error {}

export function parsePath(path: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = path.trim().replace(/^\$\.?/, "");
  while (i < s.length) {
    const c = s[i];
    if (c === ".") {
      i++;
      continue;
    }
    if (c === "[") {
      const end = s.indexOf("]", i);
      if (end < 0) throw new PathError(`Unclosed "[" in ${path}`);
      const inner = s.slice(i + 1, end).trim();
      i = end + 1;
      if (inner === "*") tokens.push({ t: "wild" });
      else if (/^-?\d+$/.test(inner)) tokens.push({ t: "index", i: parseInt(inner, 10) });
      else if (/^["'].*["']$/.test(inner)) tokens.push({ t: "key", k: inner.slice(1, -1) });
      else if (inner.startsWith("?")) {
        const m = inner.slice(1).match(/^([\w.]+)\s*==?\s*["']?([^"']*)["']?$/);
        if (!m) throw new PathError(`Bad filter [${inner}] in ${path}`);
        tokens.push({ t: "filter", k: m[1], v: m[2] });
      } else throw new PathError(`Bad segment [${inner}] in ${path}`);
      continue;
    }
    const m = s.slice(i).match(/^[A-Za-z_$][\w$-]*/);
    if (!m) throw new PathError(`Unexpected "${c}" at ${i} in ${path}`);
    tokens.push({ t: "key", k: m[0] });
    i += m[0].length;
  }
  return tokens;
}

const MISSING = Symbol("missing");

function step(values: unknown[], tok: Token, multi: { v: boolean }): unknown[] {
  const out: unknown[] = [];
  for (const v of values) {
    if (v == null) continue;
    if (tok.t === "key") {
      if (typeof v === "object" && tok.k in (v as object))
        out.push((v as Record<string, unknown>)[tok.k]);
    } else if (Array.isArray(v)) {
      if (tok.t === "index") {
        const idx = tok.i < 0 ? v.length + tok.i : tok.i;
        if (idx >= 0 && idx < v.length) out.push(v[idx]);
      } else if (tok.t === "wild") {
        multi.v = true;
        out.push(...v);
      } else {
        multi.v = true;
        out.push(...v.filter((it) => String(getPath(it, tok.k)) === tok.v));
      }
    }
  }
  return out;
}

/** Returns `undefined` when missing. Wildcards/filters return an array. */
export function getPath(data: unknown, path: string): unknown {
  const tokens = parsePath(path);
  let values: unknown[] = [data];
  const multi = { v: false };
  for (const tok of tokens) values = step(values, tok, multi);
  if (multi.v) return values;
  return values.length ? values[0] : undefined;
}

export function resolveSource(source: Source, data: unknown): { value: unknown; missing: boolean } {
  switch (source.kind) {
    case "constant":
      return { value: source.value, missing: false };
    case "path": {
      const v = getPath(data, source.path);
      if (v === undefined || v === null) {
        if (source.default !== undefined) return { value: source.default, missing: false };
        return { value: undefined, missing: true };
      }
      return { value: v, missing: false };
    }
    case "template": {
      let missing = false;
      const out = source.template
        .replace(/\{([^}]+)\}/g, (_, p: string) => {
          const v = getPath(data, p.trim());
          if (v == null) {
            missing = true;
            return "";
          }
          return String(v);
        })
        .replace(/\s+/g, " ")
        .trim();
      return { value: out, missing: missing && out === "" };
    }
    case "aggregate": {
      const raw = getPath(data, source.path);
      const arr = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]).filter(
        (x) => x != null,
      );
      if (!arr.length && source.op !== "count") return { value: undefined, missing: true };
      const nums = arr.map(Number).filter((n) => !Number.isNaN(n));
      switch (source.op) {
        case "sum":
          return { value: nums.reduce((a, b) => a + b, 0), missing: false };
        case "count":
          return { value: arr.length, missing: false };
        case "min":
          return { value: Math.min(...nums), missing: false };
        case "max":
          return { value: Math.max(...nums), missing: false };
        case "join":
          return { value: arr.join(source.separator ?? ", "), missing: false };
      }
    }
  }
  return { value: MISSING, missing: true };
}

export function testOp(actual: unknown, op: Condition["op"], expected?: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual as never);
    case "exists":
      return actual !== undefined && actual !== null;
    case "truthy":
      return Boolean(actual);
    case "gt":
      return Number(actual) > Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
  }
}

export function evalCondition(c: Condition | undefined, data: unknown): boolean {
  if (!c) return true;
  return testOp(getPath(data, c.path), c.op, c.value);
}
