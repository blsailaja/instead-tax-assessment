import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Play,
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
  ExternalLink,
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
  const [tab, setTab] = useState<"tour" | "scenarios">("tour");

  const steps = useMemo(
    () => [
      {
        id: "inspect",
        title: "1. Field Mapping & Typography",
        icon: FileText,
        subtitle: "Every box has exact geometry, typography, and formatting rules",
        description:
          "INSTEAD maps each IRS form cell with PDF points (72 DPI) relative to the top-left origin. Fields define font size, alignment, auto-shrink rules, and formatting (currency, masks, comb cells).",
        actionHint:
          "We selected taxpayer.lastName on Page 1. Notice how the Inspector on the right shows its exact coordinates, font settings, and resolved data value.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
          s.setTool("select");
          s.setSelectedId("taxpayer.lastName");
        },
        interactiveDemos: [
          {
            label: "Select Line 1a (Wages Sum)",
            desc: "Calculates sum of all W-2 wages ($124,500)",
            run: () => {
              s.setPage(0);
              s.setSelectedId("line1a");
              toast.info("Selected Line 1a: Sum aggregate over income.w2[*].wages");
            },
          },
          {
            label: "Select SSN Mask Field",
            desc: "Formatted with 999-99-9999 mask",
            run: () => {
              s.setPage(0);
              s.setSelectedId("taxpayer.ssn");
              toast.info("Selected SSN: Formatted with SSN digit mask");
            },
          },
          {
            label: "Select Direct Deposit Comb (Page 2)",
            desc: "Monospace comb cells for bank routing",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.routing");
              toast.info("Selected Routing number comb cells on Page 2");
            },
          },
        ],
      },
      {
        id: "reactivity",
        title: "2. Real-Time Return Data Reactivity",
        icon: DollarSign,
        subtitle: "Live nested JSON paths instantly propagate to canvas fields",
        description:
          "The Return Data panel feeds live JSON data into the template using standard path queries like income.w2[0].wages, taxpayer.firstName, or aggregates like sum(). Any changes update the canvas in real time.",
        actionHint:
          "Try clicking one of the preset return buttons below to watch the values on the 1040 form re-calculate and re-render instantly.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
        },
        interactiveDemos: [
          {
            label: "Fill High Earners ($285k W-2)",
            desc: "Updates Jordan & Casey's wages to $185k + $100k",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.income = current.income || {};
                current.income.w2 = [
                  { employer: "Anthropic PBC", wages: 185000, fedWithholding: 38000 },
                  { employer: "Stripe Inc", wages: 100000, fedWithholding: 22000 },
                ];
                s.setDataText(JSON.stringify(current, null, 2));
                s.setSelectedId("line1a");
                toast.success("Updated return data: Line 1a now calculates $285,000!");
              } catch (err) {
                console.error(err);
              }
            },
          },
          {
            label: "Change Taxpayer Name",
            desc: "Sets taxpayer to 'Elena V. Rostova'",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.taxpayer = current.taxpayer || {};
                current.taxpayer.firstName = "ELENA V";
                current.taxpayer.lastName = "ROSTOVA";
                s.setDataText(JSON.stringify(current, null, 2));
                s.setSelectedId("taxpayer.lastName");
                toast.success("Updated taxpayer name on canvas in real-time!");
              } catch (err) {
                console.error(err);
              }
            },
          },
          {
            label: "Reset to Sample Return",
            desc: "Restores standard Rivera family return",
            run: () => {
              s.reset();
              toast.info("Reset to standard sample return data.");
            },
          },
        ],
      },
      {
        id: "comb",
        title: "3. Comb Cells & Segmented Boxes",
        icon: Grid,
        subtitle: "Character-by-character alignment for routing, SSN, and account numbers",
        description:
          "Paper tax forms demand monospace comb cells where each digit sits precisely inside an optical box. INSTEAD handles cell width, cell spacing, and right/left alignment automatically.",
        actionHint:
          "Notice the routing number box on Page 2 with 9 discrete cells. Each character from the return data is centered in its own cell.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(1);
          s.setSelectedId("refund.routing");
        },
        interactiveDemos: [
          {
            label: "Inspect Routing Comb (9 cells)",
            desc: "Page 2 Line 35b routing number",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.routing");
              toast.info("Routing number: 9 comb cells with 14pt width each");
            },
          },
          {
            label: "Inspect Account Comb (17 cells)",
            desc: "Page 2 Line 35d account number",
            run: () => {
              s.setPage(1);
              s.setSelectedId("refund.account");
              toast.info("Account number: 17 comb cells for direct deposit");
            },
          },
          {
            label: "Change Routing to Chase Bank (021000021)",
            desc: "Watches the comb cells fill digit by digit",
            run: () => {
              try {
                const current = JSON.parse(s.dataText);
                current.refund = current.refund || {};
                current.refund.routing = "021000021";
                s.setDataText(JSON.stringify(current, null, 2));
                s.setPage(1);
                s.setSelectedId("refund.routing");
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
        title: "4. Live Validation & Margin Diagnostics",
        icon: AlertTriangle,
        subtitle: "Detects unprintable margins, overlaps, and text overflow before printing",
        description:
          "The built-in validation pipeline audits every field in real time. It catches boxes drawn outside the physical printer margin (18pt / 0.25in), boxes overlapping form ink or adjacent fields, and text clipping.",
        actionHint:
          "Click below to deliberately trigger a margin error or overlap. You will see the red warning badge appear on the canvas and in the sidebar issue counter.",
        setup: () => {
          s.setMode("annotate");
          s.setPage(0);
        },
        interactiveDemos: [
          {
            label: "Trigger Unprintable Margin Error",
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
              toast.error("Validation error triggered: Box is outside 18pt printable margin!");
            },
          },
          {
            label: "Trigger Field Overlap Warning",
            desc: "Creates a box that overlaps taxpayer.lastName",
            run: () => {
              const testField: Field = {
                id: "demo_overlap_field",
                label: "TEST: Overlapping Field",
                page: 0,
                rect: { x: 260, y: 96, width: 100, height: 14 },
                type: "text",
                source: { kind: "literal", value: "OVERLAP!" },
                format: { kind: "text", transform: "uppercase" },
              };
              s.addField(testField);
              s.setSelectedId("demo_overlap_field");
              toast.warning("Validation warning triggered: Box collides with taxpayer.lastName!");
            },
          },
          {
            label: "Clear Test Injections",
            desc: "Removes test error fields and restores clean return",
            run: () => {
              s.removeField("demo_error_margin");
              s.removeField("demo_overlap_field");
              s.setSelectedId("taxpayer.lastName");
              toast.success("Validation test fields cleared. All 66 fields valid!");
            },
          },
        ],
      },
      {
        id: "calibration",
        title: "5. Physical Printer Calibration",
        icon: Sliders,
        subtitle: "Correct for laser & inkjet mechanical feed offsets and paper stretch",
        description:
          "Every printer grips paper slightly differently. The Calibrate mode dims the form background, enables millimeter/point measurement rulers, overlays crosshair alignment guides, and applies global X/Y offset and scale factors.",
        actionHint:
          "In Calibrate mode, the calibration toolbar lets you adjust offset and scale. Notice how all field boxes shift precisely while keeping font proportions true.",
        setup: () => {
          s.setMode("calibrate");
          s.setPage(0);
        },
        interactiveDemos: [
          {
            label: "Simulate Laser Printer Shift (+2.5 pt X, -1.5 pt Y)",
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
            label: "Simulate Paper Shrink Compensation (100.3% scale)",
            desc: "Expands coordinates for heat-shrink laser stock",
            run: () => {
              s.setMode("calibrate");
              s.setCalibration({
                offsetX: 0,
                offsetY: 0,
                scaleX: 1.003,
                scaleY: 1.003,
                printableMargin: 18,
              });
              toast.info("Applied 100.3% thermal expansion scale calibration");
            },
          },
          {
            label: "Reset Calibration to 0 Offset",
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
        title: "6. Production Vector PDF Flattening & Export",
        icon: Download,
        subtitle: "Export filled PDFs, transparent overlays, or INSTEAD JSON specs",
        description:
          "INSTEAD uses pdf-lib to flatten vector glyphs directly into the PDF content stream. You can generate a complete filled Form 1040, an overlay-only PDF for pre-printed physical tax paper, or export the full annotation spec.",
        actionHint:
          "Click the button below to open the Export dialog and inspect all 4 production export targets.",
        setup: () => {
          s.setMode("preview");
          s.setPage(0);
          s.setSelectedId(null);
        },
        interactiveDemos: [
          {
            label: "Launch Production Export Dialog",
            desc: "Opens the 4-target export workflow",
            run: () => {
              onClose();
              onOpenExport();
              toast.info("Export dialog opened: Choose Filled PDF, Overlay, or JSON Spec");
            },
          },
          {
            label: "Switch to Form Preview Mode",
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
    [s, onClose, onOpenExport],
  );

  const current = steps[currentStep];

  useEffect(() => {
    if (open && tab === "tour") {
      steps[currentStep]?.setup();
    }
  }, [open, currentStep, tab, steps]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold leading-tight">
                INSTEAD Form Studio — Feature Demo & Playground
              </h2>
              <p className="text-xs text-muted-foreground">
                Interactively try field mapping, live data updates, validation, comb cells, and PDF
                export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border bg-muted/40 px-6 pt-2">
          <button
            onClick={() => setTab("tour")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === "tour"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Guided 6-Step Feature Tour ({currentStep + 1}/6)
          </button>
          <button
            onClick={() => setTab("scenarios")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === "scenarios"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Quick Demo Return Scenarios (1-Click)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "tour" ? (
            <div className="space-y-6">
              {/* Stepper Progress Bar */}
              <div className="flex items-center justify-between gap-1">
                {steps.map((st, i) => (
                  <button
                    key={st.id}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "flex flex-1 items-center gap-1.5 rounded p-1.5 text-xs font-medium transition-colors",
                      i === currentStep
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : i < currentStep
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    <span className="grid h-4 w-4 place-items-center rounded-full text-[10px]">
                      {i < currentStep ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:inline truncate">{st.id}</span>
                  </button>
                ))}
              </div>

              {/* Current Step Overview */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <current.icon className="h-4 w-4" />
                  <span>{current.subtitle}</span>
                </div>
                <h3 className="mt-1 font-serif text-xl font-semibold">{current.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {current.description}
                </p>
                <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary">
                  💡 <span className="font-semibold">Live in Studio:</span> {current.actionHint}
                </div>
              </div>

              {/* Interactive Try-it Actions */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Click to Try This Feature Live:
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {current.interactiveDemos.map((demo, idx) => (
                    <button
                      key={idx}
                      onClick={() => demo.run()}
                      className="group flex flex-col items-start rounded-md border border-border bg-card p-3 text-left transition-all hover:border-primary hover:bg-accent/40 hover:shadow-sm"
                    >
                      <span className="flex items-center gap-1 font-medium text-sm text-foreground group-hover:text-primary">
                        <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                        {demo.label}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground leading-normal">
                        {demo.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a pre-built demo return scenario to load real tax profiles and explore how
                INSTEAD handles different filing situations:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Scenario 1 */}
                <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-primary">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-semibold">
                        Standard W-2 Married Filing Jointly
                      </h4>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        Baseline
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Jordan & Casey Rivera. Dual W-2 earners ($124,500 total wages), standard
                      deduction, and $1,420 direct deposit refund.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      s.reset();
                      s.setPage(0);
                      s.setSelectedId("line1a");
                      toast.success("Loaded Baseline 2025 Form 1040 Sample");
                      onClose();
                    }}
                  >
                    Load Standard Return
                  </Button>
                </div>

                {/* Scenario 2 */}
                <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-primary">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-semibold">High Income Dual W-2s ($295,000)</h4>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        High Earners
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tech couple with Anthropic PBC & Stripe W-2s, higher withholding, child tax
                      credit, and $5,240 refund into Chase comb cells.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      try {
                        const base = JSON.parse(s.dataText);
                        base.income.w2 = [
                          { employer: "Anthropic PBC", wages: 195000, fedWithholding: 42000 },
                          { employer: "Stripe Inc", wages: 100000, fedWithholding: 24000 },
                        ];
                        base.refund = { routing: "021000021", account: "9876543210123" };
                        s.setDataText(JSON.stringify(base, null, 2));
                        s.setPage(0);
                        s.setSelectedId("line1a");
                        toast.success("Loaded High-Income Scenario ($295,000 Line 1a)");
                        onClose();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    Load High-Income Profile
                  </Button>
                </div>

                {/* Scenario 3 */}
                <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-destructive">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-semibold">Validation Diagnostics Test</h4>
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Stress Test
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Deliberately introduces 1 margin boundary violation and 1 field collision to
                      test the live validation badges and error counts.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      s.addField({
                        id: "stress_margin_err",
                        label: "Out of Printable Margin",
                        page: 0,
                        rect: { x: 5, y: 12, width: 80, height: 14 },
                        type: "text",
                        source: { kind: "literal", value: "MARGIN" },
                        format: { kind: "text", transform: "uppercase" },
                      });
                      s.setSelectedId("stress_margin_err");
                      toast.error("Injected margin validation error for testing");
                      onClose();
                    }}
                  >
                    Inject Validation Stress Test
                  </Button>
                </div>

                {/* Scenario 4 */}
                <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-primary">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-semibold">Print Hardware Calibration</h4>
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                        Calibration
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Switches directly to Calibrate mode with +3.0pt X, -2.0pt Y offset simulation
                      to view printer alignment crosshairs.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      s.setMode("calibrate");
                      s.setCalibration({
                        offsetX: 3.0,
                        offsetY: -2.0,
                        scaleX: 1.0,
                        scaleY: 1.0,
                        printableMargin: 18,
                      });
                      toast.info("Switched to Hardware Print Calibration mode");
                      onClose();
                    }}
                  >
                    Open Calibration Test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                s.reset();
                toast.info("Reset studio to baseline");
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset All
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tab === "tour" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Previous
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep((c) => Math.min(steps.length - 1, c + 1))}
                  >
                    Next Feature <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      onClose();
                      onOpenExport();
                    }}
                  >
                    Finish & Export PDF <Download className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
            {tab === "scenarios" && (
              <Button size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
