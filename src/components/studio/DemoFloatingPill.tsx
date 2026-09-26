import { Sparkles, Play, RefreshCw, X, Sliders, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Studio } from "./useStudio";
import { toast } from "sonner";
import { useState } from "react";

interface DemoFloatingPillProps {
  s: Studio;
  onOpenModal: () => void;
  onOpenExport: () => void;
}

export function DemoFloatingPill({ s, onOpenModal, onOpenExport }: DemoFloatingPillProps) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur hover:bg-accent transition-all"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Interactive Demo</span>
        </button>
      </div>
    );
  }

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
