import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  FileText,
  DollarSign,
  Grid,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Zap,
  Target,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Studio } from "./useStudio";
import type { Field } from "@/lib/annotation/types";
import { cn } from "@/lib/utils";

interface DemoTourModalProps {
  s: Studio;
  open: boolean;
  onClose: () => void;
  onOpenExport: () => void;
}

export function DemoTourModal({ s, open, onClose, onOpenExport }: DemoTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"tour" | "scenarios">("tour");
  const autoPlayTimerRef = useRef<number | null>(null);

  const scrollFieldIntoView = useCallback((fieldId: string) => {
    setTimeout(() => {
      const el = document.getElementById(`field-box-${fieldId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 120);
  }, []);

  const steps = useMemo(
    () => [
      {
        id: "inspect",
        title: "Field Mapping & Point Geometry",
        badge: "Feature 1 of 6",
        icon: FileText,
        targetFieldId: "taxpayer.lastName",
        subtitle: "Precise 72 DPI PDF point coordinates & font typography",
        description:
          "Every Form 1040 box is mapped in PDF points relative to the top-left origin. Fields enforce font sizing, alignment, auto-shrink limits, and currency formatting.",
        canvasHint:
          "Look at the highlighted box on Page 1 (taxpayer.lastName). The Inspector on the right displays its exact x, y, width, height, and typography rules.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
          s.setTool("select");
          s.setSelectedId("taxpayer.lastName");
          scrollFieldIntoView("taxpayer.lastName");
        },
        actions: [
          {
            label: "Select Line 1a Wages",
            desc: "W-2 sum aggregate ($124,500)",
            run: () => {
              s.setPage(0);
              s.setSelectedId("line1a");
              scrollFieldIntoView("line1a");
              toast.info("Selected Line 1a: Sum aggregate over income.w2[*].wages ($124,500)");
            },
          },
          {
            label: "Select SSN Mask Field",
            desc: "Formatted with 999-99-9999 mask",
            run: () => {
              s.setPage(0);
              s.setSelectedId("taxpayer.ssn");
              scrollFieldIntoView("taxpayer.ssn");
              toast.info("Selected SSN: Formatted with SSN digit mask");
            },
          },
          {
            label: "Inspect Routing Comb (Page 2)",
            desc: "Monospace 9-cell comb box",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.routing");
              scrollFieldIntoView("refund.routing");
              toast.info("Switched to Page 2: Routing number monospace comb cells");
            },
          },
        ],
      },
      {
        id: "reactivity",
        title: "Real-Time Return Data Reactivity",
        badge: "Feature 2 of 6",
        icon: DollarSign,
        targetFieldId: "line1a",
        subtitle: "Nested JSON data instantly recalculates and updates the form",
        description:
          "The Return Data panel feeds live JSON data into the template using standard path queries like income.w2[0].wages, taxpayer.firstName, or aggregates like sum(). Any changes update the canvas in real time.",
        canvasHint:
          "Click the test buttons below to watch the values on the 1040 form re-calculate and re-render instantly on the screen.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
          s.setSelectedId("line1a");
          scrollFieldIntoView("line1a");
        },
        actions: [
          {
            label: "⚡ Fill $285k High Earners",
            desc: "Updates wages to $185k + $100k",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.income = current.income || {};
                current.income.w2 = [
                  { employer: "Anthropic PBC", wages: 185000, fedWithholding: 38000 },
                  { employer: "Stripe Inc", wages: 100000, fedWithholding: 22000 },
                ];
                s.setDataText(JSON.stringify(current, null, 2));
                s.setPage(0);
                s.setSelectedId("line1a");
                scrollFieldIntoView("line1a");
                toast.success("Updated return data: Line 1a now calculates $285,000!");
              } catch (err) {
                console.error(err);
              }
            },
          },
          {
            label: "⚡ Change Taxpayer to Elena Rostova",
            desc: "Sets taxpayer name to ELENA V. ROSTOVA",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.taxpayer = current.taxpayer || {};
                current.taxpayer.firstName = "ELENA V";
                current.taxpayer.lastName = "ROSTOVA";
                s.setDataText(JSON.stringify(current, null, 2));
                s.setPage(0);
                s.setSelectedId("taxpayer.lastName");
                scrollFieldIntoView("taxpayer.lastName");
                toast.success("Updated taxpayer name on canvas in real-time!");
              } catch (err) {
                console.error(err);
              }
            },
          },
          {
            label: "↺ Reset Baseline Return",
            desc: "Restores standard Rivera family return",
            run: () => {
              s.reset();
              s.setPage(0);
              s.setSelectedId("taxpayer.lastName");
              scrollFieldIntoView("taxpayer.lastName");
              toast.info("Reset to standard sample return data ($124,500 wages).");
            },
          },
        ],
      },
      {
        id: "comb",
        title: "Monospace Comb Cells & Alignment",
        badge: "Feature 3 of 6",
        icon: Grid,
        targetFieldId: "refund.routing",
        subtitle: "Digit-by-digit optical positioning for routing & bank accounts",
        description:
          "Paper tax forms demand monospace comb cells where each digit sits precisely inside an optical box. INSTEAD handles cell width, cell spacing, and right/left alignment automatically.",
        canvasHint:
          "Notice Line 35b on Page 2 with 9 discrete cells. Each digit from the return data is centered in its own cell box.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(1);
          s.setSelectedId("refund.routing");
          scrollFieldIntoView("refund.routing");
        },
        actions: [
          {
            label: "🔍 Inspect Routing Comb (9 cells)",
            desc: "Page 2 Line 35b routing number",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.routing");
              scrollFieldIntoView("refund.routing");
              toast.info("Routing number: 9 comb cells with 14pt width each");
            },
          },
          {
            label: "🔍 Inspect Account Comb (17 cells)",
            desc: "Page 2 Line 35d account number",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.account");
              scrollFieldIntoView("refund.account");
              toast.info("Account number: 17 comb cells for direct deposit");
            },
          },
          {
            label: "⚡ Fill Chase Routing (021000021)",
            desc: "Watches the comb cells fill digit by digit",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.refund = current.refund || {};
                current.refund.routing = "021000021";
                s.setDataText(JSON.stringify(current, null, 2));
                s.setPage(1);
                s.setSelectedId("refund.routing");
                scrollFieldIntoView("refund.routing");
                toast.success("Updated Chase routing number in comb cells!");
              } catch (err) {
                console.error(err);
              }
            },
          },
        ],
      },
      {
        id: "validation",
        title: "Live Geometry & Margin Validation",
        badge: "Feature 4 of 6",
        icon: AlertTriangle,
        targetFieldId: "taxpayer.lastName",
        subtitle: "Catches 18pt unprintable margins, overlaps, and text clipping",
        description:
          "The built-in validation engine audits every field in real time. It catches boxes drawn outside the physical printer margin (18pt / 0.25in), boxes overlapping form ink or adjacent fields, and text clipping.",
        canvasHint:
          "Click 'Trigger Margin Error' below to see an instant red alert on the canvas, then click 'Auto-Fix & Snap' to see it automatically repair.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
          scrollFieldIntoView("taxpayer.lastName");
        },
        actions: [
          {
            label: "⚠️ Trigger Unprintable Margin Error",
            desc: "Creates a box at x: 8, y: 10 (outside 18pt margin)",
            run: () => {
              const testField: Field = {
                id: "demo_error_margin",
                label: "TEST: Off-Margin Field",
                page: 0,
                rect: { x: 8, y: 10, width: 90, height: 14 },
                type: "text",
                source: { kind: "literal", value: "OFF MARGIN" },
                format: { kind: "text", transform: "uppercase" },
              };
              s.addField(testField);
              s.setSelectedId("demo_error_margin");
              scrollFieldIntoView("demo_error_margin");
              toast.error("Validation error: Field placed inside 18pt unprintable margin!");
            },
          },
          {
            label: "⚡ Auto-Fix & Snap Inside Margin",
            desc: "Moves off-margin field to safe x: 18, y: 18",
            run: () => {
              const target = s.template.fields.find(
                (f) => f.id === "demo_error_margin" || f.id.startsWith("stress_"),
              );
              if (target) {
                s.updateField(target.id, {
                  rect: { ...target.rect, x: 18, y: 18 },
                });
                s.setSelectedId(target.id);
                scrollFieldIntoView(target.id);
                toast.success("Auto-fixed: Snapped field to safe 18pt boundary!");
              } else {
                toast.info("No off-margin test field found to fix.");
              }
            },
          },
          {
            label: "🗑️ Clear Test Injections",
            desc: "Removes test error fields",
            run: () => {
              s.removeField("demo_error_margin");
              s.removeField("demo_overlap_field");
              s.setSelectedId("taxpayer.lastName");
              scrollFieldIntoView("taxpayer.lastName");
              toast.success("Test fields cleared. All fields valid!");
            },
          },
        ],
      },
      {
        id: "calibration",
        title: "Hardware Print Calibration & Alignment",
        badge: "Feature 5 of 6",
        icon: Sliders,
        targetFieldId: undefined,
        subtitle: "Correct laser feed shifts, thermal paper shrink & margins",
        description:
          "Printers mechanically grab and heat paper differently. Calibrate mode dims form background opacity to 25%, displays alignment rulers & crosshairs, and applies real-time X/Y offset & scale correction.",
        canvasHint:
          "The canvas is now in Calibrate mode with alignment crosshairs and 2-inch reference rulers. Try applying simulated hardware offsets below.",
        setup: () => {
          s.setMode("calibrate");
          s.setPage(0);
        },
        actions: [
          {
            label: "📐 Simulate +2.5pt X Laser Offset",
            desc: "Compensates for rightward mechanical paper grab",
            run: () => {
              s.setMode("calibrate");
              s.setCalibration({
                offsetX: 2.5,
                offsetY: -1.5,
                scaleX: 1.0,
                scaleY: 1.0,
                printableMargin: 18,
              });
              toast.info("Applied +2.5pt X / -1.5pt Y printer offset calibration");
            },
          },
          {
            label: "📐 Simulate 100.3% Paper Stretch",
            desc: "Compensates for laser fuser paper thermal stretch",
            run: () => {
              s.setMode("calibrate");
              s.setCalibration({
                offsetX: 0,
                offsetY: 0,
                scaleX: 1.003,
                scaleY: 1.003,
                printableMargin: 18,
              });
              toast.info("Applied 100.3% thermal scale calibration");
            },
          },
          {
            label: "↺ Reset Calibration to 0",
            desc: "Restores standard 1:1 baseline calibration",
            run: () => {
              s.setCalibration({
                offsetX: 0,
                offsetY: 0,
                scaleX: 1.0,
                scaleY: 1.0,
                printableMargin: 18,
              });
              toast.success("Calibration reset to exact origin (0, 0, 100%)");
            },
          },
        ],
      },
      {
        id: "export",
        title: "Vector PDF Flattening & Production Export",
        badge: "Feature 6 of 6",
        icon: Download,
        targetFieldId: undefined,
        subtitle: "Export filled PDFs, transparent overlays, or INSTEAD JSON specs",
        description:
          "INSTEAD uses pdf-lib to flatten vector glyphs directly into the PDF content stream. You can generate a complete filled Form 1040, an overlay-only PDF for pre-printed physical tax paper, or export the full annotation spec.",
        canvasHint:
          "The canvas is in clean Preview mode (clean IRS 1040 view). Click 'Open Export Dialog' to test generating production PDFs.",
        setup: () => {
          s.setMode("preview");
          s.setPage(0);
          s.setSelectedId(null);
        },
        actions: [
          {
            label: "📥 Open Production Export Dialog",
            desc: "Opens the 4-target export workflow",
            run: () => {
              onOpenExport();
              toast.info("Export dialog opened: Choose Filled PDF, Overlay, or JSON Spec");
            },
          },
          {
            label: "👁️ Preview Mode (Clean 1040 View)",
            desc: "Hides all UI bounding boxes for final print review",
            run: () => {
              s.setMode("preview");
              s.setSelectedId(null);
              toast.info("Preview mode active: Authentic IRS Form 1040 print view");
            },
          },
        ],
      },
    ],
    [s, onOpenExport, scrollFieldIntoView],
  );

  const current = steps[currentStep];

  // Run step setup on step change
  useEffect(() => {
    if (open && activeTab === "tour") {
      steps[currentStep]?.setup();
    }
  }, [open, currentStep, activeTab, steps]);

  // Auto-play timer
  useEffect(() => {
    if (!open || !autoPlay || activeTab !== "tour") {
      setProgress(0);
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    const duration = 8000;
    const interval = 100;
    let elapsed = 0;

    autoPlayTimerRef.current = window.setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        elapsed = 0;
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }
    }, interval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [open, autoPlay, currentStep, steps.length, activeTab]);

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const scenarios = [
    {
      title: "Standard Baseline Return",
      subtitle: "Jordan & Casey Rivera (MFJ, $124,500 W-2, $1,420 refund)",
      icon: CheckCircle2,
      color: "text-emerald-500",
      apply: () => {
        s.reset();
        s.setMode("annotate");
        s.setPage(0);
        s.setSelectedId("taxpayer.lastName");
        scrollFieldIntoView("taxpayer.lastName");
        toast.success("Loaded Baseline Return: Rivera family Form 1040");
      },
    },
    {
      title: "High-Earner Tech Couple",
      subtitle: "$295,000 dual W-2 wages with Chase direct deposit routing",
      icon: DollarSign,
      color: "text-blue-500",
      apply: () => {
        try {
          const current = JSON.parse(s.dataText);
          current.taxpayer = { firstName: "ALEXANDER", lastName: "CHEN", ssn: "492-00-8812" };
          current.spouse = { firstName: "MAYA", lastName: "CHEN", ssn: "492-00-8813" };
          current.income = {
            w2: [
              { employer: "Google LLC", wages: 195000, fedWithholding: 42000 },
              { employer: "OpenAI Inc", wages: 100000, fedWithholding: 22000 },
            ],
          };
          current.refund = { routing: "021000021", account: "9876543210123" };
          s.setDataText(JSON.stringify(current, null, 2));
          s.setMode("annotate");
          s.setPage(0);
          s.setSelectedId("line1a");
          scrollFieldIntoView("line1a");
          toast.success("Loaded High-Earner Return ($295,000 W-2 sum on Line 1a)");
        } catch (err) {
          console.error(err);
        }
      },
    },
    {
      title: "Validation Margin Stress Test",
      subtitle: "Injects field outside 18pt printable margin to test diagnostics",
      icon: AlertTriangle,
      color: "text-amber-500",
      apply: () => {
        const testField: Field = {
          id: "stress_margin_err",
          label: "STRESS: Off-Margin Field",
          page: 0,
          rect: { x: 5, y: 12, width: 80, height: 14 },
          type: "text",
          source: { kind: "literal", value: "MARGIN VIOLATION" },
          format: { kind: "text", transform: "uppercase" },
        };
        s.addField(testField);
        s.setMode("annotate");
        s.setPage(0);
        s.setSelectedId("stress_margin_err");
        scrollFieldIntoView("stress_margin_err");
        toast.error("Injected margin validation error at x:5, y:12!");
      },
    },
    {
      title: "Printer Hardware Calibration Test",
      subtitle: "Applies laser mechanical shift (+2.5pt X) & paper shrink (100.3%)",
      icon: Sliders,
      color: "text-purple-500",
      apply: () => {
        s.setMode("calibrate");
        s.setCalibration({
          offsetX: 2.5,
          offsetY: -1.5,
          scaleX: 1.003,
          scaleY: 1.003,
          printableMargin: 18,
        });
        toast.info("Applied laser mechanical offset and thermal scale calibration");
      },
    },
  ];

  if (!open) return null;

  // Minimized Compact Dock (slim floating bar that doesn't block anything)
  if (minimized) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-4 py-2 shadow-2xl backdrop-blur-md">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-foreground">
          {current.badge}: {current.title}
        </span>
        <div className="flex items-center gap-1 border-l border-border pl-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handlePrev}
            title="Previous feature"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleNext}
            title="Next feature"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-primary"
            onClick={() => setMinimized(false)}
            title="Expand feature guide"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground"
            onClick={onClose}
            title="Close demo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded Non-Blocking Floating Tour Dock
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl transition-all duration-300">
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card/95 shadow-2xl backdrop-blur-md">
        {/* Auto-play progress bar */}
        {autoPlay && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                {current.badge}
              </span>
              <h3 className="text-sm font-semibold text-foreground tracking-tight hidden sm:inline">
                {current.title}
              </h3>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => {
                  setAutoPlay(false);
                  setCurrentStep(idx);
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
                title={`Jump to ${st.badge}: ${st.title}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={autoPlay ? "default" : "outline"}
              className="h-7 text-xs px-2 gap-1"
              onClick={() => setAutoPlay(!autoPlay)}
              title={autoPlay ? "Pause auto tour" : "Auto-play all 6 features"}
            >
              {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="hidden sm:inline">{autoPlay ? "Pause" : "Auto-Play"}</span>
            </Button>

            <div className="flex items-center border-l border-border pl-1.5 gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={handlePrev}
                title="Previous feature"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={handleNext}
                title="Next feature"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setMinimized(true)}
                title="Minimize tour dock"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onClose}
                title="Close demo"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tab switch: Tour vs Pre-built scenarios */}
        <div className="flex border-b border-border/60 bg-muted/20 px-4 text-xs">
          <button
            onClick={() => setActiveTab("tour")}
            className={cn(
              "px-3 py-1.5 font-medium border-b-2 transition-colors",
              activeTab === "tour"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Step-by-Step Feature Walkthrough
          </button>
          <button
            onClick={() => setActiveTab("scenarios")}
            className={cn(
              "px-3 py-1.5 font-medium border-b-2 transition-colors",
              activeTab === "scenarios"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            1-Click Return Profiles & Tests
          </button>
        </div>

        {/* Body content */}
        {activeTab === "tour" ? (
          <div className="p-4 grid gap-3 sm:grid-cols-12 items-center">
            {/* Left: What to look at */}
            <div className="sm:col-span-7 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Target className="h-3.5 w-3.5" />
                <span>On Canvas: {current.canvasHint}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>
            </div>

            {/* Right: Live Interactive Try-It-Now Buttons */}
            <div className="sm:col-span-5 flex flex-wrap sm:flex-col gap-1.5 border-t sm:border-t-0 sm:border-l border-border/80 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Try Live On Form:
              </span>
              {current.actions.map((act) => (
                <button
                  key={act.label}
                  onClick={() => {
                    setAutoPlay(false);
                    act.run();
                  }}
                  className="inline-flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-accent/50 transition-all text-left shadow-xs"
                >
                  <span className="font-semibold text-primary">{act.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden lg:inline ml-2">
                    {act.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.title}
                  onClick={sc.apply}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={cn("h-4 w-4", sc.color)} />
                    <span className="text-xs font-semibold text-foreground">{sc.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {sc.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
