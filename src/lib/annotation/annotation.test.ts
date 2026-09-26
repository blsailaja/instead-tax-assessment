import { describe, expect, it } from "vitest";
import { getPath, resolveSource } from "./resolve";
import { applyMask, formatCurrency, formatDate } from "./format";
import { geometryIssues, layoutTemplate } from "./layout";
import { parsePageRange } from "./pdf";
import template from "../../data/f1040.template.json";
import sample from "../../data/sample-return.json";
import type { Template } from "./types";

const t = template as unknown as Template;

describe("paths", () => {
  it("resolves nested, index, negative, wildcard, filter", () => {
    expect(getPath(sample, "taxpayer.firstName")).toBe("Jordan");
    expect(getPath(sample, "dependents[1].firstName")).toBe("Leo");
    expect(getPath(sample, "dependents[-1].relationship")).toBe("Son");
    expect(getPath(sample, "income.w2[*].wages")).toEqual([142500, 98250]);
    expect(getPath(sample, "income.w2[?employer=Acme Corp].wages")).toEqual([142500]);
    expect(getPath(sample, "$.address['city']")).toBe("San Francisco");
    expect(getPath(sample, "nope.nope")).toBeUndefined();
  });
  it("aggregates and templates", () => {
    expect(
      resolveSource({ kind: "aggregate", op: "sum", path: "income.w2[*].wages" }, sample).value,
    ).toBe(240750);
    expect(
      resolveSource({ kind: "template", template: "{taxpayer.firstName} {taxpayer.nope}" }, sample)
        .value,
    ).toBe("Jordan");
  });
});

describe("formats", () => {
  it("currency", () => {
    const f = {
      kind: "currency" as const,
      decimals: 0,
      negativeStyle: "parentheses" as const,
      zero: "blank" as const,
    };
    expect(formatCurrency(1950.75, f).text).toBe("1,951");
    expect(formatCurrency(-1800, f).text).toBe("(1,800)");
    expect(formatCurrency(0, f).text).toBeNull();
    expect(formatCurrency("abc", f).error).toBeTruthy();
  });
  it("mask + date", () => {
    expect(applyMask("123456789", "###-##-####").text).toBe("123-45-6789");
    expect(applyMask("94103", "#####-####", true).text).toBe("94103");
    expect(formatDate("2025-04-15", "MM/DD/YYYY").text).toBe("04/15/2025");
  });
});

describe("1040 template", () => {
  it("renders sample with no errors", () => {
    const r = layoutTemplate(t, sample);
    const errors = r.flatMap((x) => x.issues).filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    expect(r.find((x) => x.field.id === "line1a")?.text).toBe("240,750");
    expect(r.find((x) => x.field.id === "filingStatus.MFJ")?.checked).toBe(true);
  });
  it("flags geometry issues", () => {
    const f = { ...t.fields[0], rect: { x: 2, y: 2, width: 50, height: 10 } };
    expect(geometryIssues({ ...t, fields: [f] }, f).map((i) => i.code)).toContain(
      "outside-printable",
    );
    const g = { ...t.fields[0], id: "dupe" };
    expect(geometryIssues({ ...t, fields: [t.fields[0], g] }, g).map((i) => i.code)).toContain(
      "overlap-field",
    );
  });
  it("page ranges", () => {
    expect(parsePageRange("all", 2)).toEqual([0, 1]);
    expect(parsePageRange("2", 2)).toEqual([1]);
    expect(() => parsePageRange("3", 2)).toThrow();
  });
});
