import { Sparkles, AlertTriangle, Check, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Studio } from "./useStudio";
import { toast } from "sonner";
import { useState } from "react";

interface DemoFloatingPillProps {
  s: Studio;
  onOpenModal: () => void;
  onOpenExport: () => void;
}

export function DemoFloatingPill({ s, onOpenModal }: DemoFloatingPillProps) {
  const [minimized, setMinimized] = useState(false);

  // Check for injected test fields or margin errors
  const testField = s.template.fields.find(
    (f) =>
      f.id.startsWith("demo_") ||
      f.id.startsWith("stress_") ||
      f.label.toLowerCase().includes("margin"),
  );

  const errorReport = s.reports.find((r) =>
    r.allIssues.some(
      (i) => i.code === "outside-printable" || i.code === "off-page" || i.severity === "error",
    ),
  );

  const hasMarginIssue = Boolean(testField || errorReport);

  const handleSnapMargin = () => {
    const target = testField ?? errorReport?.field;
    if (!target) return;
    const margin = s.calibration?.printableMargin ?? 18;
    const page = s.template.pages[target.page] ?? { width: 612, height: 792 };
    const newX = Math.max(margin, Math.min(target.rect.x, page.width - margin - target.rect.width));
    const newY = Math.max(
      margin,
      Math.min(target.rect.y, page.height - margin - target.rect.height),
    );

    s.updateField(target.id, {
      rect: { ...target.rect, x: Math.round(newX), y: Math.round(newY) },
    });
    s.setSelectedId(target.id);
    toast.success(`Snapped "${target.label}" inside the ${margin}pt printable margin!`);
  };

  const handleClearTestFields = () => {
    const testIds = s.template.fields
      .filter((f) => f.id.startsWith("demo_") || f.id.startsWith("stress_"))
      .map((f) => f.id);

    if (testIds.length === 0) {
      s.reset();
      toast.info("Reset to baseline sample return.");
      return;
    }

    testIds.forEach((id) => s.removeField(id));
    s.setSelectedId("taxpayer.lastName");
    toast.success("Removed all injected test validation fields!");
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur hover:bg-accent transition-all"
        >
          {hasMarginIssue ? (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {hasMarginIssue ? "Validation Issue" : "Demo Guide"}
          </span>
        </button>
      </div>
    );
  }

  // Active validation alert mode
  if (hasMarginIssue) {
    const target = testField ?? errorReport?.field;
    return (
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-card/95 p-3 shadow-xl backdrop-blur max-w-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Injected Margin Error Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {target?.label ?? "Field"} is outside 18pt printable margin
              </p>
            </div>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSnapMargin}
          >
            <Zap className="mr-1 h-3 w-3" /> Auto-Fix & Snap
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
            onClick={handleClearTestFields}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Clear Test
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 ml-auto"
            onClick={onOpenModal}
          >
            Tour
          </Button>
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-primary/30 bg-card/95 p-2 shadow-xl backdrop-blur max-w-sm">
      <div className="flex items-center gap-2 px-1">
        <span className="grid h-7 w-7 place-items-center rounded bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground">Try Studio Features</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {s.mode === "annotate" && "Annotate mode: inspect fields & return data"}
            {s.mode === "preview" && "Preview mode: clean IRS 1040 print view"}
            {s.mode === "calibrate" && "Calibrate mode: printer alignment & rulers"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-l border-border pl-2">
        <Button size="sm" variant="default" className="h-7 text-xs px-2.5" onClick={onOpenModal}>
          Open Tour
        </Button>
        <button
          onClick={() => setMinimized(true)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Minimize pill"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
