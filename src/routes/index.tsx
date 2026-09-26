import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tax Form Annotation Spec — print values onto IRS forms" },
      {
        name: "description",
        content:
          "INSTEAD Form Studio maps, validates, calibrates, and exports values onto U.S. tax forms.",
      },
      { property: "og:title", content: "INSTEAD Form Studio" },
      {
        property: "og:description",
        content: "Map, validate, calibrate, and export values onto U.S. tax forms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const example = `{
  "id": "line1a",
  "label": "Wages from Form(s) W-2, box 1",
  "line": "1a",
  "page": 0,
  "rect": { "x": 504, "y": 450, "width": 72, "height": 12 },
  "type": "currency",
  "source": {
    "kind": "aggregate", "op": "sum",
    "path": "income.w2[*].wages"
  },
  "format": {
    "kind": "currency", "decimals": 0,
    "negativeStyle": "parentheses", "zero": "blank"
  },
  "style": { "align": "right", "fontFamily": "mono" }
}`;

function Index() {
  const features = [
    [
      "Geometry",
      "PDF points, top-left origin, per-page. Comb cells for routing and account numbers.",
    ],
    [
      "Nested data paths",
      "a.b[0], [-1], [*] wildcards, [?type=W2] filters, templates and aggregates.",
    ],
    [
      "Formatting",
      "Currency, masks (SSN, ZIP), dates, digits, casing, checkbox rules, auto-shrink.",
    ],
    [
      "Live validation",
      "Unprintable margins, overlap with form ink or other boxes, overflow, missing data.",
    ],
    [
      "Print calibration",
      "Offset and scale correction, rulers, crosshairs and a printable test page.",
    ],
    [
      "Import & export",
      "Import any PDF (boxes auto-detected), export filled PDFs, overlays and page ranges.",
    ],
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            INSTEAD · Form 1040 · Tax year 2025
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05]">
            INSTEAD Form Studio
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Map every field once, validate it against the source form, calibrate the print output,
            and export a production-ready Form 1040.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/studio"
              className="inline-flex h-10 items-center rounded-sm bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open the studio
            </Link>
            <Link
              to="/walkthrough"
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-primary/40 bg-primary/5 px-5 font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              5-Min Video Walkthrough
            </Link>
            <Link
              to="/spec"
              className="inline-flex h-10 items-center rounded-sm border border-input bg-card px-5 hover:bg-muted"
            >
              Read the specification
            </Link>
          </div>
          <dl className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map(([t, b]) => (
              <div key={t} className="border-t border-border pt-3">
                <dt className="font-serif font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
        <pre className="self-start overflow-x-auto rounded-sm border border-border bg-card p-6 font-mono text-[12.5px] leading-relaxed shadow-[0_12px_40px_-16px_oklch(0.3_0.09_262/0.35)]">
          {example}
        </pre>
      </main>
    </div>
  );
}
