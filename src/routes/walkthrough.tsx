import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Video,
  Sparkles,
  Layers,
  AlertTriangle,
  Sliders,
  Compass,
  Laptop,
  ArrowRight,
  Download,
  MousePointer2,
  SquarePlus,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useStudio, type Mode } from "@/components/studio/useStudio";
import { PageCanvas } from "@/components/studio/PageCanvas";
import { Sidebar } from "@/components/studio/Sidebar";
import { Inspector } from "@/components/studio/Inspector";
import { CalibrationPanel } from "@/components/studio/CalibrationPanel";
import { ExportDialog } from "@/components/studio/ExportDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/walkthrough")({
  head: () => ({
    meta: [
      { title: "5-Minute Video Walkthrough & Live Demo — INSTEAD Form Studio" },
      {
        name: "description",
        content:
          "Guided 5-minute interactive video walkthrough and live functional demo of the INSTEAD Form Studio architecture, canvas, validation, calibration, and roadmap.",
      },
    ],
  }),
  component: WalkthroughPage,
});

interface Chapter {
  id: number;
  title: string;
  startSec: number;
  endSec: number;
  icon: typeof Video;
  narration: string;
  keyPoints: string[];
  demoActionLabel: string;
  demoActionSetup: (s: ReturnType<typeof useStudio>, openExport: () => void) => void;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "1. The Problem & INSTEAD Standard",
    startSec: 0,
    endSec: 45,
    icon: Sparkles,
    narration:
      "Welcome to the INSTEAD Form Studio walkthrough. Every tax season, tax engines calculate millions of returns, but printing that data accurately onto rigid government PDFs like IRS Form 1040 is notoriously fragile. Traditional approaches hardcode brittle pixel offsets or rely on manual form filling. INSTEAD solves this by establishing an open, declarative annotation specification. It decouples tax calculations from document placement, treating forms as version-controlled layout contracts.",
    keyPoints: [
      "Decouples complex tax calculations from document placement",
      "Standardized 72 DPI PDF point coordinate system (top-left origin)",
      "Strict JSON Schema v1.0.0 ensuring portable cross-platform rendering",
    ],
    demoActionLabel: "View Raw Layout Spec",
    demoActionSetup: (s) => {
      s.setMode("annotate");
      s.setSelectedId("line1a");
      toast.info("Showing Line 1a annotation specification in live studio");
    },
  },
  {
    id: 2,
    title: "2. Visual Studio & Coordinate Geometry",
    startSec: 45,
    endSec: 125,
    icon: Layers,
    narration:
      "Inside the Studio, IRS Form 1040 is rendered with high fidelity using PDF.js. Because traditional PDF coordinates place (0,0) at the bottom-left, INSTEAD normalizes all bounding boxes to the top-left, matching modern CSS layout models. Notice our support for single-character comb cells on SSN and routing numbers. When you select a field, the Inspector reveals its JSON path binding—such as 'income.w2[*].wages'—which supports array wildcards, filters, and aggregations without writing custom parsing code.",
    keyPoints: [
      "Interactive bounding box drawing, resizing, and snapping",
      "Automatic comb cell partitioning for SSNs and account numbers",
      "Nested path expressions with wildcards: income.w2[*].wages",
      "Field formatters: currency formatting, zero-blanking, and SSN masking",
    ],
    demoActionLabel: "Inspect SSN Comb & Wages",
    demoActionSetup: (s) => {
      s.setMode("annotate");
      s.setPage(0);
      s.setSelectedId("taxpayer.ssn");
      toast.info("Selected SSN Comb Cell: Notice the 11 character partitions in the live canvas!");
    },
  },
  {
    id: 3,
    title: "3. Real-Time Validation & Ink Conflict",
    startSec: 125,
    endSec: 195,
    icon: AlertTriangle,
    narration:
      "Tax form compliance requires zero errors. The Studio features an active validation pipeline that continuously checks four critical rules: physical printer margin clipping at 0.25 inches, text overflow when dynamic values exceed box widths, overlaps between adjacent fields, and missing data paths. If a user drags a field into an unprintable margin or if a large dollar amount threatens to clip, the studio flags it with immediate visual warning halos and actionable recommendations.",
    keyPoints: [
      "Unprintable margin enforcement (0.25-inch minimum threshold)",
      "Text length and width overflow simulation based on font metrics",
      "Collision detection between neighboring input fields",
      "Missing schema path and invalid data type warnings",
    ],
    demoActionLabel: "Show Live Issues & Preview",
    demoActionSetup: (s) => {
      s.setMode("preview");
      toast.warning(
        "Preview mode active: Live return data mapped onto Form 1040 with ink validation!",
      );
    },
  },
  {
    id: 4,
    title: "4. Hardware Calibration & PDF Export",
    startSec: 195,
    endSec: 255,
    icon: Sliders,
    narration:
      "Every physical office printer feeds paper with slight mechanical variances. Our built-in Calibration panel allows tax preparers to configure sub-millimeter horizontal and vertical offsets, as well as scale multipliers. Once calibrated, users can export via our PDF-lib pipeline in two modes: a composite filled PDF ready for electronic filing, or an overlay-only PDF that prints pure ink onto official pre-printed IRS form blanks without ghosting lines.",
    keyPoints: [
      "Sub-millimeter X/Y printer drift compensation",
      "Interactive printable calibration test grid with crosshairs",
      "Composite PDF export (form graphic + dynamic data merged)",
      "Overlay-only PDF export for pre-printed government forms",
    ],
    demoActionLabel: "Open Calibration & PDF Export",
    demoActionSetup: (s, openExport) => {
      s.setMode("calibrate");
      openExport();
      toast.success("Opened Live PDF Export Dialog: Try generating a Composite or Overlay PDF!");
    },
  },
  {
    id: 5,
    title: "5. Technical Decisions & Future Roadmap",
    startSec: 255,
    endSec: 290,
    icon: Compass,
    narration:
      "Our technical stack is built on TanStack Start with Vite and React 19 for instantaneous performance and SSR resilience. All state transitions support undo and redo stacks, and the client gracefully falls back if backend credentials are not set. Looking forward, our roadmap includes multi-jurisdiction templates for 50-state tax returns, and Gemini multimodal vision to automatically identify boxes on newly released IRS draft forms.",
    keyPoints: [
      "Built with TanStack Start, React 19, Tailwind CSS v4, and pdf-lib",
      "Roadmap: Expansion to State forms (CA 540, NY IT-201) and Schedules",
      "Roadmap: Gemini Multimodal Vision to auto-detect fields on new IRS drafts",
      "Roadmap: Cryptographic template hashing for compliance audits",
    ],
    demoActionLabel: "Test Interactive Reset / History",
    demoActionSetup: (s) => {
      s.reset();
      toast.info("Reset live studio state to pristine IRS Form 1040 template");
    },
  },
];

const TOTAL_DURATION = 290; // 4 minutes 50 seconds
const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 text-sm hover:bg-muted";

function WalkthroughPage() {
  const [activeTab, setActiveTab] = useState<"video" | "demo">("video");
  const [currentSec, setCurrentSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Live Functional Studio Hook Instance
  const studio = useStudio();

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeChapter =
    CHAPTERS.find((c) => currentSec >= c.startSec && currentSec < c.endSec) ||
    CHAPTERS[CHAPTERS.length - 1];

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Voice narration handling
  const speakCurrentChapter = useCallback(
    (chapter: Chapter) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chapter.narration);
      utterance.rate = playbackSpeed;
      utterance.pitch = 1.0;
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, playbackSpeed],
  );

  const handlePlay = () => {
    if (currentSec >= TOTAL_DURATION) {
      setCurrentSec(0);
    }
    setIsPlaying(true);
    if (activeChapter && voiceEnabled) {
      speakCurrentChapter(activeChapter);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  };

  // Timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentSec((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            if (synthRef.current) synthRef.current.cancel();
            return TOTAL_DURATION;
          }
          const next = prev + 1;
          const nextChapter = CHAPTERS.find((c) => c.startSec === next);
          if (nextChapter && voiceEnabled) {
            speakCurrentChapter(nextChapter);
          }
          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, voiceEnabled, speakCurrentChapter]);

  const seekTo = (sec: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION, sec));
    setCurrentSec(clamped);
    const targetChapter =
      CHAPTERS.find((c) => clamped >= c.startSec && clamped < c.endSec) ||
      CHAPTERS[CHAPTERS.length - 1];
    if (isPlaying && voiceEnabled && targetChapter) {
      speakCurrentChapter(targetChapter);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const copyScript = () => {
    const fullScript = CHAPTERS.map(
      (c) =>
        `[${formatTime(c.startSec)} - ${formatTime(c.endSec)}] ${c.title}\n${c.narration}\nKey Points:\n${c.keyPoints.map((p) => `- ${p}`).join("\n")}`,
    ).join("\n\n---\n\n");

    navigator.clipboard.writeText(fullScript).then(() => {
      setCopied(true);
      toast.success("5-minute walkthrough script copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const triggerLiveDemo = (chapter: Chapter) => {
    setActiveTab("demo");
    chapter.demoActionSetup(studio, () => setExportOpen(true));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader>
        <Link
          to="/studio"
          className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Open Studio
        </Link>
      </SiteHeader>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Header Title & Mode Switcher */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Interactive Video & Live Demo Deliverable · Max 5:00
            </div>
            <h1 className="font-serif text-3xl font-semibold mt-1">
              INSTEAD Form Studio Walkthrough & Live Demo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Autonomous 5-minute video demonstration and fully functional live demo studio covering
              problem scope, interactive canvas, validation, calibration, and PDF export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-sm border border-input p-0.5 bg-card">
              <button
                onClick={() => setActiveTab("video")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-xs font-medium transition-all",
                  activeTab === "video"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Video className="h-3.5 w-3.5" />
                Video Presentation
              </button>
              <button
                onClick={() => setActiveTab("demo")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-xs font-medium transition-all",
                  activeTab === "demo"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                Live Demo Studio
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyScript}
              className="gap-1.5 text-xs font-mono"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied Script" : "Copy Loom Script"}
            </Button>

            {activeTab === "video" && (
              <Button
                variant={voiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  } else if (next && isPlaying && activeChapter) {
                    speakCurrentChapter(activeChapter);
                  }
                }}
                className="gap-1.5 text-xs"
              >
                {voiceEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
                {voiceEnabled ? "Voiceover On" : "Voiceover Muted"}
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: 5-MINUTE VIDEO WALKTHROUGH */}
        {activeTab === "video" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Video Player Display Container */}
            <div className="relative rounded-lg border border-border bg-black text-white shadow-2xl overflow-hidden aspect-[16/9] flex flex-col justify-between">
              {/* Top Bar inside Video */}
              <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-xs z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/90 text-white font-mono px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase">
                    INSTEAD Walkthrough
                  </span>
                  <span className="text-gray-300 font-medium">
                    {activeChapter ? activeChapter.title : "Introduction"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => triggerLiveDemo(activeChapter)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  >
                    <span>⚡ Try This Feature Live</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <div className="font-mono text-emerald-400 font-medium">
                    {formatTime(currentSec)} / {formatTime(TOTAL_DURATION)}
                  </div>
                </div>
              </div>

              {/* Central Animated Content Canvas for the Video */}
              <div className="flex-1 flex items-center justify-center p-6 relative select-none">
                {/* Visual Screen Simulation based on current Chapter */}
                {activeChapter.id === 1 && (
                  <div className="w-full max-w-3xl space-y-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-red-500/40 bg-red-950/20 p-4 rounded text-left">
                        <p className="text-xs uppercase font-mono text-red-400 font-semibold mb-1">
                          Legacy Approach: Brittle
                        </p>
                        <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                          <li>Hardcoded absolute pixel coordinates</li>
                          <li>Breaks on minor IRS layout revisions</li>
                          <li>Clipping in physical printer margins</li>
                          <li>Coupled tax logic with document rendering</li>
                        </ul>
                      </div>
                      <div className="border border-emerald-500/40 bg-emerald-950/20 p-4 rounded text-left">
                        <p className="text-xs uppercase font-mono text-emerald-400 font-semibold mb-1">
                          INSTEAD Standard: Declarative
                        </p>
                        <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                          <li>Versioned JSON layout specifications</li>
                          <li>Normalized 72 pt/inch top-left coordinates</li>
                          <li>Dynamic data binding via JSONPath query</li>
                          <li>Standardized comb, currency & date formatters</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded p-3 text-left font-mono text-[11px] text-gray-300 flex items-center justify-between">
                      <div>
                        <span className="text-purple-400">{"{"}</span>
                        <span className="text-blue-300"> "id"</span>:{" "}
                        <span className="text-amber-300">"line1a"</span>,
                        <span className="text-blue-300"> "rect"</span>:{" "}
                        <span className="text-emerald-400">
                          {"{ x: 504, y: 450, width: 72, height: 12 }"}
                        </span>
                        ,<span className="text-blue-300"> "source"</span>:{" "}
                        <span className="text-amber-300">"income.w2[*].wages"</span>,
                        <span className="text-blue-300"> "format"</span>:{" "}
                        <span className="text-emerald-400">"currency"</span>
                        <span className="text-purple-400">{" }"}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => triggerLiveDemo(activeChapter)}
                        className="text-xs h-7 text-black font-semibold"
                      >
                        Inspect Live
                      </Button>
                    </div>
                  </div>
                )}

                {activeChapter.id === 2 && (
                  <div className="w-full max-w-4xl grid grid-cols-3 gap-4 animate-in fade-in duration-500 text-left">
                    <div className="col-span-2 border border-gray-700 bg-gray-900 rounded p-4 relative h-64 overflow-hidden">
                      <div className="text-[10px] font-mono text-gray-400 border-b border-gray-800 pb-1 mb-2 flex justify-between">
                        <span>FORM 1040 (2025) · PAGE 1 CANVAS</span>
                        <span className="text-emerald-400">SNAP 1.0pt ACTIVE</span>
                      </div>
                      <div className="space-y-3 pt-2">
                        <div className="border border-blue-400 bg-blue-500/20 p-2 rounded flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-blue-300">Line 1a:</span> Wages &
                            Salaries
                            <p className="font-mono text-[10px] text-gray-400">
                              source: income.w2[*].wages
                            </p>
                          </div>
                          <span className="font-mono bg-blue-900/60 px-2 py-1 rounded text-blue-200 font-bold">
                            $78,450
                          </span>
                        </div>

                        <div className="border border-purple-400 bg-purple-500/20 p-2 rounded text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-purple-300">SSN Comb Cells:</span>
                            <span className="font-mono text-[10px] text-purple-200">
                              11 characters
                            </span>
                          </div>
                          <div className="grid grid-cols-11 gap-1 text-center font-mono font-bold text-xs">
                            {["4", "5", "8", "-", "2", "1", "-", "9", "0", "4", "2"].map(
                              (ch, i) => (
                                <div
                                  key={i}
                                  className="border border-purple-400/60 bg-purple-950/80 py-1 rounded"
                                >
                                  {ch}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-700 bg-gray-900/80 rounded p-3 text-xs space-y-3 flex flex-col justify-between">
                      <div>
                        <p className="font-mono uppercase text-gray-400 text-[10px]">
                          Inspector Properties
                        </p>
                        <div className="border-t border-gray-800 pt-1 space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between text-gray-400">
                            <span>Origin:</span> <span className="text-white">Top-Left (0,0)</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Coordinates:</span>{" "}
                            <span className="text-white">504, 450 pt</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Comb Cells:</span>{" "}
                            <span className="text-emerald-400">Auto-Partition</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Font Metric:</span>{" "}
                            <span className="text-white">IBM Plex Mono</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => triggerLiveDemo(activeChapter)}
                        className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Try Selecting Comb Cells
                      </Button>
                    </div>
                  </div>
                )}

                {activeChapter.id === 3 && (
                  <div className="w-full max-w-3xl space-y-3 animate-in fade-in duration-500 text-left">
                    <div className="border border-amber-500/50 bg-amber-950/30 rounded p-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-semibold text-amber-300">
                            Live Validation Pipeline Active
                          </p>
                          <p className="text-gray-300 text-[11px] mt-0.5">
                            Checks every field in real-time against IRS margins, text overflow, and
                            graphic collisions.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => triggerLiveDemo(activeChapter)}
                        className="text-xs h-7 text-black font-semibold shrink-0"
                      >
                        Open Live Preview
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="border border-gray-800 bg-gray-900 p-3 rounded space-y-1.5">
                        <p className="font-mono text-emerald-400 font-semibold text-[11px]">
                          PASSING CHECKS
                        </p>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Physical 0.25" Margin Bounds (18pt safe zone)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Valid Schema Path Resolution</span>
                        </div>
                      </div>

                      <div className="border border-gray-800 bg-gray-900 p-3 rounded space-y-1.5">
                        <p className="font-mono text-amber-400 font-semibold text-[11px]">
                          ACTIVE MONITORS
                        </p>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span>Dynamic Overflow Auto-Shrink Algorithm</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="h-2 w-2 rounded-full bg-blue-400" />
                          <span>Field Collision & Ink Overlap Detection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeChapter.id === 4 && (
                  <div className="w-full max-w-3xl space-y-3 animate-in fade-in duration-500 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-700 bg-gray-900 p-4 rounded space-y-2">
                        <p className="text-xs font-mono uppercase text-gray-400">
                          Printer Calibration Controls
                        </p>
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between text-gray-300 mb-1">
                              <span>X-Offset Drift:</span>{" "}
                              <span className="font-mono text-emerald-400">+0.8 mm</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[60%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-gray-300 mb-1">
                              <span>Y-Offset Drift:</span>{" "}
                              <span className="font-mono text-emerald-400">-0.4 mm</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[45%]" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-700 bg-gray-900 p-4 rounded space-y-2 text-xs flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="font-mono uppercase text-gray-400">PDF-lib Export Modes</p>
                          <div className="border border-emerald-500/30 bg-emerald-950/20 p-2 rounded">
                            <p className="font-semibold text-emerald-300">1. Composite PDF</p>
                            <p className="text-[11px] text-gray-300">
                              Merges form background with calculated values.
                            </p>
                          </div>
                          <div className="border border-blue-500/30 bg-blue-950/20 p-2 rounded">
                            <p className="font-semibold text-blue-300">2. Overlay Ink Only</p>
                            <p className="text-[11px] text-gray-300">
                              Prints dynamic ink onto pre-printed IRS blanks.
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => triggerLiveDemo(activeChapter)}
                          className="w-full text-xs h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          Launch Real PDF Export
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeChapter.id === 5 && (
                  <div className="w-full max-w-3xl space-y-3 animate-in fade-in duration-500 text-left">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="border border-gray-800 bg-gray-900 p-3 rounded">
                        <p className="font-mono text-emerald-400 font-semibold mb-1">
                          ARCHITECTURE DECISIONS
                        </p>
                        <ul className="text-gray-300 space-y-1 text-[11px] list-disc list-inside">
                          <li>TanStack Start + React 19 for fast SSR & hydration</li>
                          <li>Tailwind CSS v4 with semantic OKLCH color spaces</li>
                          <li>Zero external cloud dependency for core local studio</li>
                          <li>Undo/Redo command pattern on all geometry changes</li>
                        </ul>
                      </div>

                      <div className="border border-gray-800 bg-gray-900 p-3 rounded">
                        <p className="font-mono text-purple-400 font-semibold mb-1">
                          FUTURE ROADMAP
                        </p>
                        <ul className="text-gray-300 space-y-1 text-[11px] list-disc list-inside">
                          <li>Gemini Multimodal Vision for auto-mapping new IRS draft PDFs</li>
                          <li>State tax form library (CA 540, NY IT-201, IL 1040)</li>
                          <li>Cryptographic template signing & SHA256 audit logs</li>
                          <li>Wasm-based batch generation for high-volume filing</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitles / Closed Captions */}
              <div className="px-6 py-2 bg-black/85 border-t border-gray-800/80 text-center text-xs text-amber-200/90 font-medium min-h-12 flex items-center justify-center">
                {activeChapter.narration}
              </div>

              {/* Bottom Player Controls */}
              <div className="p-4 bg-gradient-to-t from-black via-black/95 to-transparent space-y-2 z-10">
                {/* Scrubber Progress Bar */}
                <div
                  className="h-2 bg-gray-800 hover:h-3 rounded-full cursor-pointer relative transition-all"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    seekTo(pos * TOTAL_DURATION);
                  }}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(currentSec / TOTAL_DURATION) * 100}%` }}
                  />
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:text-primary hover:bg-white/10"
                      onClick={() => (isPlaying ? handlePause() : handlePlay())}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 fill-white" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:text-primary hover:bg-white/10"
                      onClick={() => seekTo(0)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>

                    <div className="font-mono text-xs text-gray-400">
                      {formatTime(currentSec)} / {formatTime(TOTAL_DURATION)}
                    </div>
                  </div>

                  {/* Speed & Chapter Jumps */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 hidden sm:inline">Speed:</span>
                    {[1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          playbackSpeed === spd
                            ? "bg-primary text-white font-bold"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters Grid / Navigation with 1-Click Feature Demo buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">
                  Video Chapters & Live Demo Triggers
                </h2>
                <span className="text-xs text-muted-foreground">
                  Click any chapter to seek or test live
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {CHAPTERS.map((ch) => {
                  const Icon = ch.icon;
                  const isActive = activeChapter.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      className={`flex flex-col justify-between rounded border p-3 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >
                      <div>
                        <div className="cursor-pointer" onClick={() => seekTo(ch.startSec)}>
                          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1">
                            <span className="flex items-center gap-1">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                              Ch. {ch.id}
                            </span>
                            <span>{formatTime(ch.startSec)}</span>
                          </div>
                          <h3 className="text-xs font-semibold line-clamp-1">
                            {ch.title.split(". ")[1]}
                          </h3>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                            {ch.keyPoints[0]}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerLiveDemo(ch)}
                        className="mt-3 text-[10px] h-7 w-full gap-1 border-dashed hover:border-primary hover:text-primary"
                      >
                        <Laptop className="h-3 w-3" />
                        {ch.demoActionLabel}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE FUNCTIONAL FORM STUDIO DEMO */}
        {activeTab === "demo" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Interactive Demo Banner & Guidance */}
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Live Form 1040 Studio Demo Active:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    You can select boxes, draw annotations, inspect JSON paths, view live calculated
                    data, test printer calibration, and export real PDFs right here!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => studio.reset()}
                  className="inline-flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted font-medium"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Demo
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground font-medium hover:bg-primary/90"
                >
                  <Download className="h-3 w-3" /> Export PDF
                </button>
              </div>
            </div>

            {/* Live Studio Frame */}
            <div className="rounded-lg border border-border bg-card shadow-lg flex flex-col h-[760px] overflow-hidden">
              {/* Studio Toolbar */}
              <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
                {/* Mode Selector */}
                <div className="flex rounded-sm border border-input p-0.5">
                  {(["annotate", "preview", "calibrate"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => studio.setMode(m)}
                      className={cn(
                        "rounded-[2px] px-3 py-1 text-xs capitalize transition-colors font-medium",
                        studio.mode === m
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Tool Selector */}
                {studio.mode === "annotate" && (
                  <div className="flex gap-1">
                    <button
                      className={cn(
                        btn,
                        studio.tool === "select" && "border-ink bg-accent/40 font-semibold",
                      )}
                      onClick={() => studio.setTool("select")}
                    >
                      <MousePointer2 className="h-3.5 w-3.5" /> Select
                    </button>
                    <button
                      className={cn(
                        btn,
                        studio.tool === "draw" && "border-ink bg-accent/40 font-semibold",
                      )}
                      onClick={() => studio.setTool("draw")}
                    >
                      <SquarePlus className="h-3.5 w-3.5" /> Draw box
                    </button>
                  </div>
                )}

                {/* Page Navigation & Zoom Controls */}
                <div className="ml-auto flex items-center gap-1">
                  {studio.template.pages.map((p) => (
                    <button
                      key={p.index}
                      onClick={() => studio.setPage(p.index)}
                      className={cn(
                        btn,
                        "font-mono text-xs",
                        studio.page === p.index && "border-ink bg-accent/40 font-bold",
                      )}
                    >
                      Page {p.index + 1}
                    </button>
                  ))}
                  <span className="mx-2 h-4 w-px bg-border" />
                  <button
                    className={btn}
                    onClick={() => studio.setZoom(Math.max(0.6, +(studio.zoom - 0.15).toFixed(2)))}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-xs">
                    {Math.round(studio.zoom * 100)}%
                  </span>
                  <button
                    className={btn}
                    onClick={() => studio.setZoom(Math.min(3, +(studio.zoom + 0.15).toFixed(2)))}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Studio Body: Sidebar + Canvas + Inspector */}
              <div className="flex min-h-0 flex-1">
                <Sidebar s={studio} />

                <main className="flex min-w-0 flex-1 flex-col bg-muted overflow-auto paper-grid p-6">
                  <div className="mx-auto w-fit shadow-md">
                    <PageCanvas s={studio} />
                  </div>
                </main>

                <aside className="min-h-0 w-80 shrink-0 overflow-y-auto border-l border-border bg-card">
                  {studio.mode === "calibrate" ? (
                    <CalibrationPanel s={studio} />
                  ) : (
                    <Inspector s={studio} />
                  )}
                </aside>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Export Dialog for PDF output */}
      <ExportDialog s={studio} open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
