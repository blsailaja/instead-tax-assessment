import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/spec")({
  head: () => ({
    meta: [
      { title: "INSTEAD Form Studio — Annotation specification" },
      {
        name: "description",
        content:
          "Reference for the INSTEAD annotation format: templates, geometry, data sources, validation, and calibration.",
      },
      { property: "og:title", content: "INSTEAD Form Studio Annotation Specification" },
      {
        property: "og:description",
        content: "How INSTEAD maps U.S. tax form boxes and prints values from nested data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Spec,
});

const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20 border-t border-border py-8">
    <h2 className="font-serif text-2xl font-semibold">{title}</h2>
    <div className="mt-4 space-y-4 text-[15px] leading-relaxed">{children}</div>
  </section>
);
const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-sm border border-border bg-card p-4 font-mono text-[12.5px] leading-relaxed">
    {children}
  </pre>
);
const T = ({ rows }: { rows: string[][] }) => (
  <table className="w-full text-sm">
    <tbody>
      {rows.map((r) => (
        <tr key={r[0]} className="border-b border-border align-top">
          <td className="w-48 py-2 pr-4 font-mono text-[13px]">{r[0]}</td>
          <td className="py-2 text-muted-foreground">{r[1]}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const toc = [
  ["overview", "Overview"],
  ["template", "Template"],
  ["field", "Field"],
  ["paths", "Path syntax"],
  ["formats", "Formatters"],
  ["style", "Style & overflow"],
  ["validation", "Validation"],
  ["calibration", "Calibration"],
  ["render", "Rendering algorithm"],
  ["decisions", "Decisions"],
  ["future", "Future work"],
];

function Spec() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[200px_1fr]">
        <nav className="sticky top-6 hidden self-start lg:block">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Contents
          </p>
          <ul className="space-y-1.5 text-sm">
            {toc.map(([id, t]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-muted-foreground hover:text-foreground">
                  {t}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Specification · v1.0.0
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold">
            INSTEAD Annotation Specification
          </h1>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <a href="/docs/INSTEAD-annotation-spec.md" download>
                <Download />
                Markdown spec
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/docs/annotation-schema.json" download>
                <Download />
                JSON Schema
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/docs/form-1040-page-1.example.json" download>
                <Download />
                1040 example
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/docs/annotation-flow.mmd" download>
                <Download />
                Mermaid diagrams
              </a>
            </Button>
          </div>

          <S id="overview" title="Overview">
            <p>
              An INSTEAD annotation document describes one revision of one tax form: its pages, and
              every box on those pages. Each box says <em>where</em> it is, <em>what data</em> fills
              it, and <em>how</em> that data is formatted. Any renderer — PDF stamping, HTML
              preview, or a printer overlay — can use the same document.
            </p>
            <p>
              The spec is plain JSON, typed in TypeScript (
              <code className="font-mono">src/lib/annotation/types.ts</code>) with a reference
              implementation and tests.
            </p>
          </S>

          <S id="template" title="Template">
            <Code>{`{
  "specVersion": "1.0.0",
  "form": { "id": "irs-f1040", "name": "U.S. Individual Income Tax Return",
            "authority": "IRS", "taxYear": 2025, "revision": "2025", "omb": "1545-0074" },
  "units": "pt",            // 1/72 inch — native PDF unit
  "origin": "top-left",     // y grows downward, like screens
  "pages": [{ "index": 0, "width": 612, "height": 792 }],
  "defaults": { "style": { "fontFamily": "sans", "fontSize": 9 } },
  "calibration": { "offsetX": 0, "offsetY": 0, "scaleX": 1, "scaleY": 1, "printableMargin": 18 },
  "fields": [ /* Field[] */ ]
}`}</Code>
          </S>

          <S id="field" title="Field">
            <T
              rows={[
                ["id", "Stable unique key, e.g. line1a or dependents[0].ssn."],
                ["label / line", "Human label and the printed line number on the form."],
                ["page, rect", "Zero-based page and {x, y, width, height} in points."],
                ["type", "text · currency · date · checkbox · comb · multiline."],
                ["source", "path | aggregate | template | constant — see below."],
                ["format", "How the resolved value becomes printed text."],
                ["style", "Font, size, alignment, padding, overflow behaviour."],
                [
                  "condition",
                  "Only print when {path, op, value} holds (e.g. spouse fields for MFJ).",
                ],
                ["comb.cells", "For per-character boxes (routing/account numbers)."],
                ["pdfFieldName", "Optional link back to the source AcroForm widget."],
              ]}
            />
            <Code>{`{ "kind": "path", "path": "taxpayer.lastName", "default": "" }
{ "kind": "aggregate", "op": "sum", "path": "income.w2[*].wages" }
{ "kind": "template", "template": "{taxpayer.firstName} {taxpayer.middleInitial}" }
{ "kind": "constant", "value": "See attached" }`}</Code>
          </S>

          <S id="paths" title="Path syntax">
            <T
              rows={[
                ["a.b.c", "Nested keys. Optional leading $."],
                ["a[0] / a[-1]", "Array index; negative counts from the end."],
                ["a[*].b", "Wildcard — returns an array (use with aggregate)."],
                ["a[?type=W2].b", "Filter items whose field equals the value."],
                ['a["odd key"]', "Quoted keys for names with spaces or symbols."],
              ]}
            />
            <p>
              A missing path resolves to <code className="font-mono">undefined</code> (never
              throws), so a partially complete return still prints.
            </p>
          </S>

          <S id="formats" title="Formatters">
            <T
              rows={[
                [
                  "currency",
                  "decimals, thousandsSeparator, negativeStyle (minus|parentheses), zero (blank|zero|dash), symbol. Rounds half away from zero.",
                ],
                [
                  "mask",
                  '"###-##-####" — # consumes one alphanumeric; optionalTail allows ZIP vs ZIP+4.',
                ],
                ["date", "YYYY, YY, MM, DD tokens."],
                ["digits", "Strips non-digits."],
                ["text", "case: upper | lower | title; maxLength."],
                ["checkbox", "checkedWhen {op, value}; mark x | check."],
              ]}
            />
          </S>

          <S id="style" title="Style & overflow">
            <p>
              Styles cascade: built-in → template defaults → field.{" "}
              <code className="font-mono">overflow: "shrink"</code> reduces font size in 0.25pt
              steps down to <code className="font-mono">minFontSize</code>; if it still doesn't fit
              an <code className="font-mono">overflow</code> issue is raised. Renderers pass their
              own text-measuring function so results match real font metrics.
            </p>
          </S>

          <S id="validation" title="Validation">
            <T
              rows={[
                ["off-page", "Box extends past the page (error)."],
                ["outside-printable", "Box is inside the printer's unprintable margin (warning)."],
                ["overlap-field", "Box covers >15% of another box (error)."],
                [
                  "overlap-ink",
                  "Box sits on printed form content — measured from the page raster (warning).",
                ],
                ["overflow / comb-length", "Value doesn't fit its box or cells (error)."],
                ["format-error / missing-value / bad-path", "Data problems."],
              ]}
            />
          </S>

          <S id="calibration" title="Calibration">
            <p>
              Calibration is a printer correction, not part of the form geometry:{" "}
              <code className="font-mono">printed = rect × scale + offset</code>. It applies to
              overlay prints only. The studio prints a test page with rulers, corner crosshairs and
              a 2.00 in reference line; measuring it on paper computes the scale automatically.
            </p>
          </S>

          <S id="render" title="Rendering algorithm">
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Evaluate <code className="font-mono">condition</code>; skip if false.
              </li>
              <li>
                Resolve <code className="font-mono">source</code> against the data set.
              </li>
              <li>
                Apply <code className="font-mono">format</code> → text or checked state.
              </li>
              <li>Merge style, fit text to the box, align within padding.</li>
              <li>
                Apply calibration (overlay only) and convert to the target coordinate system — for
                PDF, <code className="font-mono">yPdf = pageHeight − y − height</code>.
              </li>
            </ol>
          </S>

          <S id="decisions" title="Decisions">
            <ul className="list-disc space-y-1 pl-5">
              <li>JSON over XML: native to web stacks, easy to diff, trivially typed.</li>
              <li>Points and top-left origin: lossless with PDF, intuitive for UI tooling.</li>
              <li>
                Separate source and format: the same value can print in different ways on different
                forms.
              </li>
              <li>
                Keep tax math out of the spec: totals come from the data set, the spec only
                aggregates simple lists.
              </li>
            </ul>
          </S>

          <S id="future" title="Future work">
            <ul className="list-disc space-y-1 pl-5">
              <li>Repeating groups (auto-overflow of dependents onto a continuation statement).</li>
              <li>Multi-line wrapping with line limits and per-form fonts.</li>
              <li>Revision diffing between tax years and automatic box migration.</li>
              <li>JSON Schema publishing and cross-field rules (e.g. line 9 = sum of lines).</li>
              <li>Shared cloud library of annotated forms with version history.</li>
            </ul>
          </S>
        </article>
      </div>
    </div>
  );
}
