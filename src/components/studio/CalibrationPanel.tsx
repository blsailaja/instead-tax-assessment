import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { calibrationTestPdf, download } from "@/lib/annotation/pdf";
import { DEFAULT_CALIBRATION, type Calibration } from "@/lib/annotation/types";
import type { Studio } from "./useStudio";
import { Row, inputCls } from "./Inspector";

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="flex-1 accent-[var(--ink)]"
        />
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value || 0)}
          className={inputCls + " w-20 font-mono"}
        />
        <span className="w-6 text-xs text-muted-foreground">{unit}</span>
      </div>
    </Row>
  );
}

export function CalibrationPanel({ s }: { s: Studio }) {
  const c = s.calibration;
  const set = (p: Partial<Calibration>) => s.setCalibration({ ...c, ...p });
  const [measured, setMeasured] = useState({ x: "", y: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  // Live test-page preview as a real PDF
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const bytes = await calibrationTestPdf(s.template, s.page, c);
      if (!alive) return;
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPreviewUrl(url);
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [s.template, s.page, c]);

  const applyMeasured = () => {
    // User measured the 2.00in reference line on paper, in inches.
    const mx = parseFloat(measured.x);
    const my = parseFloat(measured.y);
    const p: Partial<Calibration> = {};
    if (mx > 0) p.scaleX = +((c.scaleX * 2) / mx).toFixed(4);
    if (my > 0) p.scaleY = +((c.scaleY * 2) / my).toFixed(4);
    set(p);
    toast.success("Scale corrected from your measurement");
  };

  return (
    <div className="text-sm">
      <div className="border-b border-border px-4 py-3">
        <p className="font-serif text-base font-semibold">Print calibration</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Printers drift. Print the test page, lay it over a blank form against a window, then
          correct offset and scale until the crosshairs line up.
        </p>
      </div>
      <ol className="space-y-4 border-b border-border px-4 py-4">
        <li>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1 · Print the test page
          </p>
          <button
            className="inline-flex h-8 items-center gap-2 rounded-sm bg-primary px-3 text-primary-foreground hover:bg-primary/90"
            onClick={async () =>
              download(
                await calibrationTestPdf(s.template, s.page, c),
                `calibration-page${s.page + 1}.pdf`,
                "application/pdf",
              )
            }
          >
            <Download className="h-4 w-4" /> Download test page
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Print at 100% / “Actual size”, not “Fit to page”.
          </p>
        </li>
        <li className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            2 · Correct the offset
          </p>
          <Slider
            label="Horizontal offset (+ right)"
            value={c.offsetX}
            min={-36}
            max={36}
            step={0.25}
            unit="pt"
            onChange={(n) => set({ offsetX: n })}
          />
          <Slider
            label="Vertical offset (+ down)"
            value={c.offsetY}
            min={-36}
            max={36}
            step={0.25}
            unit="pt"
            onChange={(n) => set({ offsetY: n })}
          />
        </li>
        <li className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            3 · Correct the scale
          </p>
          <Slider
            label="Horizontal scale"
            value={+(c.scaleX * 100).toFixed(2)}
            min={90}
            max={110}
            step={0.1}
            unit="%"
            onChange={(n) => set({ scaleX: n / 100 })}
          />
          <Slider
            label="Vertical scale"
            value={+(c.scaleY * 100).toFixed(2)}
            min={90}
            max={110}
            step={0.1}
            unit="%"
            onChange={(n) => set({ scaleY: n / 100 })}
          />
          <div className="rounded-sm border border-border bg-muted/50 p-3">
            <p className="mb-2 text-xs">
              Or type what the 2.00 in reference line measured on paper:
            </p>
            <div className="flex gap-2">
              <input
                className={inputCls + " font-mono"}
                placeholder="width in"
                value={measured.x}
                onChange={(e) => setMeasured({ ...measured, x: e.target.value })}
              />
              <input
                className={inputCls + " font-mono"}
                placeholder="(opt) height"
                value={measured.y}
                onChange={(e) => setMeasured({ ...measured, y: e.target.value })}
              />
              <button
                className="h-8 shrink-0 rounded-sm border border-input bg-card px-3 hover:bg-muted"
                onClick={applyMeasured}
              >
                Apply
              </button>
            </div>
          </div>
        </li>
        <li>
          <Slider
            label="Unprintable margin"
            value={c.printableMargin}
            min={0}
            max={36}
            step={1}
            unit="pt"
            onChange={(n) => set({ printableMargin: n })}
          />
        </li>
      </ol>
      <div className="px-4 py-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Test-page preview
          </p>
          <button
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => s.setCalibration(DEFAULT_CALIBRATION)}
          >
            <RotateCcw className="h-3 w-3" /> reset
          </button>
        </div>
        {previewUrl ? (
          <iframe
            title="Calibration test page"
            src={previewUrl + "#toolbar=0&view=FitH"}
            className="aspect-[612/792] w-full border border-border bg-card"
          />
        ) : (
          <div className="aspect-[612/792] w-full animate-pulse bg-muted" />
        )}
      </div>
    </div>
  );
}
