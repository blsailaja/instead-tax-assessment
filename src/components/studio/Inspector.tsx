import { useEffect, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import type { Field, FieldType, Format, Source, Style } from "@/lib/annotation/types";
import { uniqueId, type Studio } from "./useStudio";
import { IssueList } from "./IssueList";

export const inputCls =
  "h-8 w-full rounded-sm border border-input bg-card px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring";
const labelCls =
  "mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Num({
  value,
  onChange,
  step = 0.5,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      className={inputCls + " font-mono"}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border px-4 py-4">
      <h3 className="font-serif text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

const DEFAULT_FORMAT: Record<string, Format | undefined> = {
  none: undefined,
  text: { kind: "text" },
  currency: {
    kind: "currency",
    decimals: 0,
    thousandsSeparator: ",",
    negativeStyle: "parentheses",
    zero: "blank",
  },
  mask: { kind: "mask", pattern: "###-##-####" },
  date: { kind: "date", pattern: "MM/DD/YYYY" },
  digits: { kind: "digits" },
  checkbox: { kind: "checkbox", checkedWhen: { op: "truthy" }, mark: "x" },
};

export function Inspector({ s }: { s: Studio }) {
  const f = s.selected;
  const report = s.reports.find((r) => r.field.id === f?.id);
  const [idDraft, setIdDraft] = useState(f?.id ?? "");
  useEffect(() => setIdDraft(f?.id ?? ""), [f?.id]);

  if (!f || !report)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        <p className="font-serif text-base text-foreground">No field selected</p>
        <p className="mt-2">
          Click a box on the form to edit its mapping, or pick “Draw box” to annotate a new one.
        </p>
        <ul className="mt-4 space-y-1 font-mono text-xs">
          <li>← → ↑ ↓ nudge 0.5pt (⇧ 5pt)</li>
          <li>⌫ delete · esc deselect</li>
        </ul>
      </div>
    );

  const up = (p: Partial<Field>) => s.updateField(f.id, p);
  const upSource = (p: Partial<Source>) => up({ source: { ...f.source, ...p } as Source });
  const upFormat = (p: Partial<Format>) =>
    up({ format: { ...(f.format as Format), ...p } as Format });
  const upStyle = (p: Partial<Style>) => up({ style: { ...(f.style ?? {}), ...p } });
  const fmt = f.format;

  return (
    <div className="text-sm">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-base font-semibold">{f.label}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {f.line ? `Line ${f.line} · ` : ""}page {f.page + 1}
            {f.pdfFieldName ? ` · ${f.pdfFieldName}` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Duplicate"
            onClick={() =>
              s.addField({
                ...f,
                id: uniqueId(s.template, f.id + "_copy"),
                rect: { ...f.rect, y: f.rect.y + f.rect.height + 2 },
              })
            }
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
            onClick={() => s.removeField(f.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-border bg-muted/60 px-4 py-3">
        <p className={labelCls}>Resolved output</p>
        <p className="min-h-5 font-mono text-sm">
          {report.hidden ? (
            <span className="text-muted-foreground">hidden by condition</span>
          ) : f.type === "checkbox" ? (
            report.checked ? (
              "☒ checked"
            ) : (
              "☐ unchecked"
            )
          ) : (
            (report.text ?? <span className="text-muted-foreground">— blank —</span>)
          )}
          {report.fontSize !== report.style.fontSize && (
            <span className="ml-2 text-xs text-warning">shrunk to {report.fontSize}pt</span>
          )}
        </p>
        {report.allIssues.length > 0 && <IssueList issues={report.allIssues} className="mt-2" />}
      </div>

      <Section title="Identity">
        <Row label="ID (unique key)">
          <input
            className={inputCls + " font-mono"}
            value={idDraft}
            onChange={(e) => setIdDraft(e.target.value)}
            onBlur={() => {
              const v = idDraft.trim();
              if (v && v !== f.id && !s.template.fields.some((x) => x.id === v))
                s.renameField(f.id, v);
              else setIdDraft(f.id);
            }}
          />
        </Row>
        <Row label="Label">
          <input
            className={inputCls}
            value={f.label}
            onChange={(e) => up({ label: e.target.value })}
          />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Form line">
            <input
              className={inputCls + " font-mono"}
              value={f.line ?? ""}
              onChange={(e) => up({ line: e.target.value || null })}
            />
          </Row>
          <Row label="Data type">
            <select
              className={inputCls}
              value={f.type}
              onChange={(e) => {
                const type = e.target.value as FieldType;
                const patch: Partial<Field> = { type };
                if (type === "currency") patch.format = DEFAULT_FORMAT["currency"];
                if (type === "checkbox") patch.format = DEFAULT_FORMAT["checkbox"];
                if (type === "date") patch.format = DEFAULT_FORMAT["date"];
                if (type === "comb" && !f.comb) patch.comb = { cells: 9 };
                up(patch);
              }}
            >
              {["text", "currency", "date", "checkbox", "comb", "multiline"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Row>
        </div>
      </Section>

      <Section title="Position (pt, top-left origin)">
        <div className="grid grid-cols-4 gap-2">
          {(["x", "y", "width", "height"] as const).map((k) => (
            <Row key={k} label={k === "width" ? "W" : k === "height" ? "H" : k.toUpperCase()}>
              <Num value={f.rect[k]} onChange={(n) => up({ rect: { ...f.rect, [k]: n } })} />
            </Row>
          ))}
        </div>
        <Row label="Page">
          <select
            className={inputCls}
            value={f.page}
            onChange={(e) => up({ page: +e.target.value })}
          >
            {s.template.pages.map((p) => (
              <option key={p.index} value={p.index}>
                Page {p.index + 1}
              </option>
            ))}
          </select>
        </Row>
        {f.type === "comb" && (
          <Row label="Comb cells">
            <Num
              step={1}
              value={f.comb?.cells ?? 1}
              onChange={(n) => up({ comb: { cells: Math.max(1, Math.round(n)) } })}
            />
          </Row>
        )}
      </Section>

      <Section title="Data source">
        <Row label="Kind">
          <select
            className={inputCls}
            value={f.source.kind}
            onChange={(e) => {
              const k = e.target.value as Source["kind"];
              const prevPath = "path" in f.source ? f.source.path : "";
              const next: Source =
                k === "path"
                  ? { kind: "path", path: prevPath }
                  : k === "aggregate"
                    ? { kind: "aggregate", op: "sum", path: prevPath }
                    : k === "template"
                      ? { kind: "template", template: prevPath ? `{${prevPath}}` : "" }
                      : { kind: "constant", value: "" };
              up({ source: next });
            }}
          >
            <option value="path">path — single value</option>
            <option value="aggregate">aggregate — sum / count / join</option>
            <option value="template">template — combine values</option>
            <option value="constant">constant</option>
          </select>
        </Row>
        {(f.source.kind === "path" || f.source.kind === "aggregate") && (
          <Row label="Path">
            <input
              className={inputCls + " font-mono"}
              placeholder="income.w2[*].wages"
              value={f.source.path}
              onChange={(e) => upSource({ path: e.target.value })}
            />
          </Row>
        )}
        {f.source.kind === "aggregate" && (
          <Row label="Operation">
            <select
              className={inputCls}
              value={f.source.op}
              onChange={(e) => upSource({ op: e.target.value as "sum" })}
            >
              {["sum", "count", "min", "max", "join"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Row>
        )}
        {f.source.kind === "template" && (
          <Row label="Template">
            <input
              className={inputCls + " font-mono"}
              value={f.source.template}
              onChange={(e) => upSource({ template: e.target.value })}
            />
          </Row>
        )}
        {f.source.kind === "constant" && (
          <Row label="Value">
            <input
              className={inputCls + " font-mono"}
              value={String(f.source.value ?? "")}
              onChange={(e) => upSource({ value: e.target.value })}
            />
          </Row>
        )}
        <Row label="Show only when (optional)">
          <div className="grid grid-cols-[1fr_80px] gap-2">
            <input
              className={inputCls + " font-mono"}
              placeholder="filingStatus"
              value={f.condition?.path ?? ""}
              onChange={(e) =>
                up({
                  condition: e.target.value
                    ? { op: "truthy", ...f.condition, path: e.target.value }
                    : undefined,
                })
              }
            />
            <select
              className={inputCls}
              disabled={!f.condition}
              value={f.condition?.op ?? "truthy"}
              onChange={(e) =>
                f.condition && up({ condition: { ...f.condition, op: e.target.value as "eq" } })
              }
            >
              {["truthy", "exists", "eq", "neq", "in", "gt", "lt"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </Row>
        {f.condition && !["truthy", "exists"].includes(f.condition.op) && (
          <Row label="Compare to (JSON)">
            <JsonInput
              value={f.condition.value}
              onChange={(v) => up({ condition: { ...f.condition!, value: v } })}
            />
          </Row>
        )}
      </Section>

      <Section title="Formatting">
        <Row label="Formatter">
          <select
            className={inputCls}
            value={fmt?.kind ?? "none"}
            onChange={(e) => up({ format: DEFAULT_FORMAT[e.target.value] })}
          >
            {Object.keys(DEFAULT_FORMAT).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Row>
        {fmt?.kind === "currency" && (
          <div className="grid grid-cols-3 gap-2">
            <Row label="Decimals">
              <Num
                step={1}
                value={fmt.decimals ?? 0}
                onChange={(n) => upFormat({ decimals: Math.max(0, Math.min(4, n)) })}
              />
            </Row>
            <Row label="Negative">
              <select
                className={inputCls}
                value={fmt.negativeStyle ?? "minus"}
                onChange={(e) => upFormat({ negativeStyle: e.target.value as "minus" })}
              >
                <option value="parentheses">(1,000)</option>
                <option value="minus">-1,000</option>
              </select>
            </Row>
            <Row label="Zero">
              <select
                className={inputCls}
                value={fmt.zero ?? "zero"}
                onChange={(e) => upFormat({ zero: e.target.value as "blank" })}
              >
                <option value="blank">blank</option>
                <option value="zero">0</option>
                <option value="dash">-0-</option>
              </select>
            </Row>
          </div>
        )}
        {fmt?.kind === "mask" && (
          <Row label="Mask (# = digit/char)">
            <input
              className={inputCls + " font-mono"}
              value={fmt.pattern}
              onChange={(e) => upFormat({ pattern: e.target.value })}
            />
          </Row>
        )}
        {fmt?.kind === "date" && (
          <Row label="Pattern">
            <input
              className={inputCls + " font-mono"}
              value={fmt.pattern}
              onChange={(e) => upFormat({ pattern: e.target.value })}
            />
          </Row>
        )}
        {fmt?.kind === "text" && (
          <Row label="Case">
            <select
              className={inputCls}
              value={fmt.case ?? ""}
              onChange={(e) => upFormat({ case: (e.target.value || undefined) as "upper" })}
            >
              <option value="">as-is</option>
              <option value="upper">UPPER</option>
              <option value="lower">lower</option>
              <option value="title">Title</option>
            </select>
          </Row>
        )}
        {fmt?.kind === "checkbox" && (
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <Row label="Checked if">
              <select
                className={inputCls}
                value={fmt.checkedWhen.op}
                onChange={(e) =>
                  upFormat({ checkedWhen: { ...fmt.checkedWhen, op: e.target.value as "eq" } })
                }
              >
                {["truthy", "eq", "neq", "in", "gt", "lt"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Row>
            <Row label="Value (JSON)">
              <JsonInput
                value={fmt.checkedWhen.value}
                onChange={(v) => upFormat({ checkedWhen: { ...fmt.checkedWhen, value: v } })}
              />
            </Row>
          </div>
        )}
      </Section>

      <Section title="Typography">
        <div className="grid grid-cols-3 gap-2">
          <Row label="Size">
            <Num value={report.style.fontSize} onChange={(n) => upStyle({ fontSize: n })} />
          </Row>
          <Row label="Min size">
            <Num value={report.style.minFontSize} onChange={(n) => upStyle({ minFontSize: n })} />
          </Row>
          <Row label="Font">
            <select
              className={inputCls}
              value={report.style.fontFamily}
              onChange={(e) => upStyle({ fontFamily: e.target.value as "sans" })}
            >
              <option>sans</option>
              <option>serif</option>
              <option>mono</option>
            </select>
          </Row>
          <Row label="Align">
            <select
              className={inputCls}
              value={report.style.align}
              onChange={(e) => upStyle({ align: e.target.value as "left" })}
            >
              <option>left</option>
              <option>center</option>
              <option>right</option>
            </select>
          </Row>
          <Row label="V-align">
            <select
              className={inputCls}
              value={report.style.verticalAlign}
              onChange={(e) => upStyle({ verticalAlign: e.target.value as "top" })}
            >
              <option>top</option>
              <option>middle</option>
              <option>bottom</option>
            </select>
          </Row>
          <Row label="Overflow">
            <select
              className={inputCls}
              value={report.style.overflow}
              onChange={(e) => upStyle({ overflow: e.target.value as "shrink" })}
            >
              <option>shrink</option>
              <option>clip</option>
              <option>error</option>
            </select>
          </Row>
        </div>
      </Section>
    </div>
  );
}

function JsonInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [txt, setTxt] = useState(JSON.stringify(value ?? null));
  useEffect(() => setTxt(JSON.stringify(value ?? null)), [value]);
  return (
    <input
      className={inputCls + " font-mono"}
      value={txt}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => {
        try {
          onChange(JSON.parse(txt));
        } catch {
          onChange(txt);
        }
      }}
    />
  );
}
