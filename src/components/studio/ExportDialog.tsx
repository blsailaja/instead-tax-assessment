import { useState } from "react";
import { Download, FileJson, FileText, Layers, Ruler } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calibrationTestPdf, download, exportPdf, parsePageRange } from "@/lib/annotation/pdf";
import { cn } from "@/lib/utils";
import type { Studio } from "./useStudio";
import { Row, inputCls } from "./Inspector";

type Kind = "filled" | "overlay" | "test" | "spec";
const KINDS: { k: Kind; icon: typeof FileText; title: string; body: string }[] = [
  {
    k: "filled",
    icon: FileText,
    title: "Completed form",
    body: "Values stamped onto the source PDF. Ideal for e-delivery and review.",
  },
  {
    k: "overlay",
    icon: Layers,
    title: "Print overlay",
    body: "Values only, on blank pages, calibrated for printing onto pre-printed forms.",
  },
  {
    k: "test",
    icon: Ruler,
    title: "Calibration test page",
    body: "Rulers, crosshairs and box outlines to align your printer.",
  },
  {
    k: "spec",
    icon: FileJson,
    title: "Annotation spec (JSON)",
    body: "The complete template: geometry, sources, formats and calibration.",
  },
];

export function ExportDialog({
  s,
  open,
  onOpenChange,
}: {
  s: Studio;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [kind, setKind] = useState<Kind>("filled");
  const [range, setRange] = useState("all");
  const [busy, setBusy] = useState(false);
  const n = s.template.pages.length;
  const errors = s.reports.filter((r) => r.allIssues.some((i) => i.severity === "error")).length;

  let rangeError: string | null = null;
  let pages: number[] = [];
  try {
    pages = parsePageRange(range, n);
  } catch (e) {
    rangeError = (e as Error).message;
  }

  const run = async () => {
    setBusy(true);
    try {
      const slug = s.template.form.id;
      if (kind === "spec") {
        const out = {
          ...s.template,
          calibration: s.calibration,
          pages: s.template.pages.map((p) => ({
            ...p,
            image: p.image?.startsWith("data:") ? undefined : p.image,
          })),
        };
        download(JSON.stringify(out, null, 2), `${slug}.annotations.json`, "application/json");
      } else if (kind === "test") {
        for (const p of pages)
          download(
            await calibrationTestPdf(s.template, p, s.calibration),
            `${slug}-calibration-p${p + 1}.pdf`,
            "application/pdf",
          );
      } else {
        const bytes = await exportPdf({
          template: s.template,
          data: s.data,
          mode: kind,
          pages,
          sourceBytes: kind === "filled" ? await s.getSourceBytes() : null,
          calibration: s.calibration,
        });
        download(
          bytes,
          `${slug}-${kind}-p${pages.map((p) => p + 1).join("_")}.pdf`,
          "application/pdf",
        );
      }
      toast.success("Export ready");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Export</DialogTitle>
          <DialogDescription>
            {s.template.form.name} · {n} page{n > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map(({ k, icon: Icon, title, body }) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-sm border p-3 text-left transition-colors",
                kind === k ? "border-ink bg-accent/30" : "border-border hover:bg-muted",
              )}
            >
              <Icon className="mb-2 h-4 w-4" />
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
            </button>
          ))}
        </div>
        {kind !== "spec" && (
          <Row label={`Pages (e.g. "all", "1", "1-2")`}>
            <input
              className={cn(inputCls, "font-mono", rangeError && "border-destructive")}
              value={range}
              onChange={(e) => setRange(e.target.value)}
            />
            {rangeError && (
              <span className="mt-1 block text-xs text-destructive">{rangeError}</span>
            )}
          </Row>
        )}
        {kind === "overlay" && (
          <p className="text-xs text-muted-foreground">
            Using calibration: offset {s.calibration.offsetX}/{s.calibration.offsetY}pt, scale{" "}
            {(s.calibration.scaleX * 100).toFixed(1)}% × {(s.calibration.scaleY * 100).toFixed(1)}%.
          </p>
        )}
        {errors > 0 && kind !== "spec" && kind !== "test" && (
          <p className="rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            {errors} field{errors > 1 ? "s have" : " has"} validation errors — the output may be
            misaligned or clipped.
          </p>
        )}
        <button
          disabled={busy || (!!rangeError && kind !== "spec")}
          onClick={run}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {busy ? "Preparing…" : "Download"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
