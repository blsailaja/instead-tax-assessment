import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileUp,
  MousePointer2,
  RotateCcw,
  Sparkles,
  SquarePlus,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useStudio, type Mode } from "@/components/studio/useStudio";
import { PageCanvas } from "@/components/studio/PageCanvas";
import { Sidebar } from "@/components/studio/Sidebar";
import { Inspector } from "@/components/studio/Inspector";
import { CalibrationPanel } from "@/components/studio/CalibrationPanel";
import { ExportDialog } from "@/components/studio/ExportDialog";
import { DemoTourModal } from "@/components/studio/DemoTourModal";
import { DemoFloatingPill } from "@/components/studio/DemoFloatingPill";
import { importPdf } from "@/lib/annotation/pdf";
import type { Template } from "@/lib/annotation/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "INSTEAD Form Studio — Form 1040 field mapping" },
      {
        name: "description",
        content:
          "Map, validate, calibrate, and print values onto Form 1040 in INSTEAD Form Studio.",
      },
      { property: "og:title", content: "INSTEAD Form Studio — Form 1040 field mapping" },
      {
        property: "og:description",
        content: "Map, validate, calibrate, and print values onto Form 1040.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 text-sm hover:bg-muted";

function StudioPage() {
  const s = useStudio();
  const [exportOpen, setExportOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const pdfInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("demo=true")) {
      setDemoOpen(true);
    }
  }, []);

  const onPdf = async (file?: File) => {
    if (!file) return;
    const id = toast.loading("Reading PDF…");
    try {
      const imp = await importPdf(file);
      s.setTemplate({
        specVersion: "1.0.0",
        form: { id: imp.name.toLowerCase().replace(/[^\w]+/g, "-"), name: imp.name },
        units: "pt",
        origin: "top-left",
        pages: imp.pages,
        defaults: s.template.defaults,
        fields: imp.fields,
      });
      s.setSourceBytes(imp.bytes);
      s.setPage(0);
      s.setSelectedId(null);
      toast.success(`Imported ${imp.pages.length} pages, ${imp.fields.length} detected boxes`, {
        id,
      });
    } catch (e) {
      toast.error(`Could not import: ${(e as Error).message}`, { id });
    }
  };
  const onJson = async (file?: File) => {
    if (!file) return;
    try {
      const t = JSON.parse(await file.text()) as Template;
      if (!Array.isArray(t.fields) || !Array.isArray(t.pages))
        throw new Error("Missing pages/fields");
      t.pages = t.pages.map((p, i) => ({ ...p, image: p.image ?? s.template.pages[i]?.image }));
      s.setTemplate(t);
      if (t.calibration) s.setCalibration(t.calibration);
      toast.success(`Loaded ${t.fields.length} annotations`);
    } catch (e) {
      toast.error(`Invalid spec: ${(e as Error).message}`);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader>
        <input
          ref={pdfInput}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => onPdf(e.target.files?.[0])}
        />
        <input
          ref={jsonInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => onJson(e.target.files?.[0])}
        />
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors shadow-xs"
          onClick={() => setDemoOpen(true)}
          title="Interactive Feature Demo & Tour"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Sparkles className="h-4 w-4" /> Try Features Demo
        </button>
        <button className={btn} onClick={() => pdfInput.current?.click()}>
          <FileUp className="h-4 w-4" /> Import PDF
        </button>
        <button className={btn} onClick={() => jsonInput.current?.click()}>
          <Upload className="h-4 w-4" /> Load spec
        </button>
        <button className={btn} title="Reset to Form 1040 sample" onClick={s.reset}>
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </SiteHeader>

      <div className="flex min-h-0 flex-1">
        <Sidebar s={s} />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
            <div className="flex rounded-sm border border-input p-0.5">
              {(["annotate", "preview", "calibrate"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => s.setMode(m)}
                  className={cn(
                    "rounded-[2px] px-3 py-1 text-sm capitalize",
                    s.mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            {s.mode === "annotate" && (
              <div className="flex gap-1">
                <button
                  className={cn(btn, s.tool === "select" && "border-ink bg-accent/40")}
                  onClick={() => s.setTool("select")}
                >
                  <MousePointer2 className="h-4 w-4" /> Select
                </button>
                <button
                  className={cn(btn, s.tool === "draw" && "border-ink bg-accent/40")}
                  onClick={() => s.setTool("draw")}
                >
                  <SquarePlus className="h-4 w-4" /> Draw box
                </button>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              {s.template.pages.map((p) => (
                <button
                  key={p.index}
                  onClick={() => s.setPage(p.index)}
                  className={cn(btn, "font-mono", s.page === p.index && "border-ink bg-accent/40")}
                >
                  p{p.index + 1}
                </button>
              ))}
              <span className="mx-2 h-5 w-px bg-border" />
              <button
                className={btn}
                onClick={() => s.setZoom(Math.max(0.6, +(s.zoom - 0.15).toFixed(2)))}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-mono text-xs">
                {Math.round(s.zoom * 100)}%
              </span>
              <button
                className={btn}
                onClick={() => s.setZoom(Math.min(3, +(s.zoom + 0.15).toFixed(2)))}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="paper-grid min-h-0 flex-1 overflow-auto bg-muted p-8">
            <div className="mx-auto w-fit">
              <PageCanvas s={s} />
            </div>
          </div>
        </main>
        <aside className="min-h-0 w-80 shrink-0 overflow-y-auto border-l border-border bg-card">
          {s.mode === "calibrate" ? <CalibrationPanel s={s} /> : <Inspector s={s} />}
        </aside>
      </div>
      <ExportDialog s={s} open={exportOpen} onOpenChange={setExportOpen} />
      <DemoTourModal
        s={s}
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onOpenExport={() => setExportOpen(true)}
      />
      <DemoFloatingPill
        s={s}
        onOpenModal={() => setDemoOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />
    </div>
  );
}
