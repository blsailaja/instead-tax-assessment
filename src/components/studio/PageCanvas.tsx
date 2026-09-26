import { useEffect, useRef, useState } from "react";
import type { Field, Rect } from "@/lib/annotation/types";
import { applyCalibration } from "@/lib/annotation/layout";
import { cn } from "@/lib/utils";
import { uniqueId, type FieldReport, type Studio } from "./useStudio";

const snap = (n: number) => Math.round(n * 2) / 2;
const FAMILY = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
} as const;

function severityOf(r: FieldReport) {
  if (r.allIssues.some((i) => i.severity === "error")) return "error";
  if (r.allIssues.some((i) => i.severity === "warning")) return "warning";
  return "ok";
}

export function PageCanvas({ s }: { s: Studio }) {
  const { template, page, zoom, mode, tool, calibration } = s;
  const meta = template.pages[page];
  const root = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Rect | null>(null);
  const drag = useRef<{
    id: string;
    kind: "move" | "resize";
    sx: number;
    sy: number;
    rect: Rect;
  } | null>(null);

  // Keyboard nudging
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const f = s.selected;
      if (!f || mode !== "annotate") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const d = e.shiftKey ? 5 : 0.5;
      const m: Record<string, [number, number]> = {
        ArrowLeft: [-d, 0],
        ArrowRight: [d, 0],
        ArrowUp: [0, -d],
        ArrowDown: [0, d],
      };
      if (m[e.key]) {
        e.preventDefault();
        s.updateField(f.id, {
          rect: { ...f.rect, x: snap(f.rect.x + m[e.key][0]), y: snap(f.rect.y + m[e.key][1]) },
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          s.redo();
        } else {
          s.undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") s.removeField(f.id);
      if (e.key === "Escape") s.setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, mode]);

  if (!meta) return null;
  const toPt = (e: React.PointerEvent) => {
    const b = root.current!.getBoundingClientRect();
    return { x: (e.clientX - b.left) / zoom, y: (e.clientY - b.top) / zoom };
  };

  const onBgDown = (e: React.PointerEvent) => {
    if (mode !== "annotate") return;
    if (tool !== "draw") {
      s.setSelectedId(null);
      return;
    }
    const p = toPt(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      id: "__draft",
      kind: "resize",
      sx: p.x,
      sy: p.y,
      rect: { x: p.x, y: p.y, width: 0, height: 0 },
    };
    setDraft({ x: snap(p.x), y: snap(p.y), width: 0, height: 0 });
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toPt(e);
    const dx = p.x - d.sx;
    const dy = p.y - d.sy;
    if (d.id === "__draft") {
      setDraft({
        x: snap(Math.min(d.sx, p.x)),
        y: snap(Math.min(d.sy, p.y)),
        width: snap(Math.abs(dx)),
        height: snap(Math.abs(dy)),
      });
      return;
    }
    const r = d.rect;
    const next =
      d.kind === "move"
        ? { ...r, x: snap(r.x + dx), y: snap(r.y + dy) }
        : {
            ...r,
            width: Math.max(2, snap(r.width + dx)),
            height: Math.max(2, snap(r.height + dy)),
          };
    s.updateField(d.id, { rect: next });
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.id === "__draft" && draft) {
      setDraft(null);
      if (draft.width < 3 || draft.height < 3) return;
      const id = uniqueId(template, "field");
      const f: Field = {
        id,
        label: "New field",
        page,
        rect: draft,
        type: "text",
        source: { kind: "path", path: "" },
      };
      s.addField(f);
      s.setTool("select");
    } else if (d) {
      s.endHistory();
    }
  };

  const startDrag = (e: React.PointerEvent, f: Field, kind: "move" | "resize") => {
    if (mode !== "annotate" || tool !== "select") return;
    e.stopPropagation();
    s.setSelectedId(f.id);
    s.beginHistory();
    const p = toPt(e);
    root.current!.setPointerCapture(e.pointerId);
    drag.current = { id: f.id, kind, sx: p.x, sy: p.y, rect: f.rect };
  };

  const reports = s.reports.filter((r) => r.field.page === page);
  const cal =
    mode === "calibrate"
      ? calibration
      : {
          offsetX: 0,
          offsetY: 0,
          scaleX: 1,
          scaleY: 1,
          printableMargin: calibration.printableMargin,
        };

  return (
    <div
      ref={root}
      className={cn(
        "relative select-none bg-card shadow-[0_1px_0_var(--border),0_12px_40px_-12px_oklch(0.3_0.09_262/0.35)]",
        tool === "draw" && mode === "annotate" && "cursor-crosshair",
      )}
      style={{ width: meta.width * zoom, height: meta.height * zoom }}
      onPointerDown={onBgDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {meta.image && (
        <img
          src={meta.image}
          alt={`${template.form.name} page ${page + 1}`}
          draggable={false}
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full",
            mode === "calibrate" && "opacity-25",
          )}
        />
      )}

      {mode === "calibrate" && <Guides w={meta.width} h={meta.height} zoom={zoom} s={s} />}
      {mode !== "preview" && (
        <div
          className="pointer-events-none absolute border border-dashed border-destructive/50"
          style={{
            left: calibration.printableMargin * zoom,
            top: calibration.printableMargin * zoom,
            right: calibration.printableMargin * zoom,
            bottom: calibration.printableMargin * zoom,
          }}
        />
      )}

      {reports.map((r) => {
        const f = r.field;
        const box = applyCalibration(f.rect, cal);
        const sel = f.id === s.selectedId;
        const sev = severityOf(r);
        const showOutline = mode !== "preview";
        return (
          <div
            key={f.id}
            onPointerDown={(e) => startDrag(e, f, "move")}
            title={`${f.label}${f.line ? ` (line ${f.line})` : ""}`}
            className={cn(
              "absolute",
              showOutline && "border",
              showOutline && sev === "ok" && "border-info/60 bg-info/5 hover:bg-info/15",
              showOutline && sev === "warning" && "border-warning bg-warning/15",
              showOutline && sev === "error" && "border-destructive bg-destructive/15",
              sel && "z-10 border-2 border-ink bg-accent/40 hover:bg-accent/40",
              r.hidden && showOutline && "opacity-40",
              mode === "annotate" && tool === "select" && "cursor-move",
            )}
            style={{
              left: box.x * zoom,
              top: box.y * zoom,
              width: box.width * zoom,
              height: box.height * zoom,
            }}
          >
            <Value r={r} zoom={zoom * cal.scaleX} />
            {sel && mode === "annotate" && (
              <div
                onPointerDown={(e) => startDrag(e, f, "resize")}
                className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-[1px] border border-card bg-ink"
              />
            )}
          </div>
        );
      })}

      {draft && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-ink bg-accent/30"
          style={{
            left: draft.x * zoom,
            top: draft.y * zoom,
            width: draft.width * zoom,
            height: draft.height * zoom,
          }}
        />
      )}
    </div>
  );
}

function Value({ r, zoom }: { r: FieldReport; zoom: number }) {
  if (r.hidden) return null;
  const st = r.style;
  const common: React.CSSProperties = {
    fontFamily: FAMILY[st.fontFamily],
    fontSize: r.fontSize * zoom,
    color: st.color,
    lineHeight: 1,
  };
  if (r.field.type === "checkbox") {
    return r.checked ? (
      <span
        className="absolute inset-0 grid place-items-center font-sans font-semibold"
        style={{ ...common, fontSize: r.field.rect.height * zoom * 0.95 }}
      >
        X
      </span>
    ) : null;
  }
  if (r.text == null) return null;
  if (r.cells && r.field.comb) {
    return (
      <div className="absolute inset-0 flex">
        {Array.from({ length: r.field.comb.cells }).map((_, i) => (
          <span key={i} className="grid flex-1 place-items-center" style={common}>
            {r.cells![i] ?? ""}
          </span>
        ))}
      </div>
    );
  }
  const justify =
    st.align === "center" ? "center" : st.align === "right" ? "flex-end" : "flex-start";
  const items =
    st.verticalAlign === "top"
      ? "flex-start"
      : st.verticalAlign === "bottom"
        ? "flex-end"
        : "center";
  return (
    <div
      className="absolute inset-0 flex overflow-hidden whitespace-nowrap"
      style={{
        ...common,
        justifyContent: justify,
        alignItems: items,
        padding: `${st.padding.y * zoom}px ${st.padding.x * zoom}px`,
        letterSpacing: st.letterSpacing * zoom,
      }}
    >
      {r.text}
    </div>
  );
}

function Guides({ w, h, zoom, s }: { w: number; h: number; zoom: number; s: Studio }) {
  const c = s.calibration;
  const ticks: React.ReactNode[] = [];
  for (let x = 0; x <= w; x += 9) {
    const len = x % 72 === 0 ? 12 : x % 36 === 0 ? 8 : 4;
    ticks.push(<line key={`x${x}`} x1={x} x2={x} y1={0} y2={len} />);
    if (x % 72 === 0 && x)
      ticks.push(
        <text key={`tx${x}`} x={x + 1.5} y={20} fontSize={6}>
          {x / 72}″
        </text>,
      );
  }
  for (let y = 0; y <= h; y += 9) {
    const len = y % 72 === 0 ? 12 : y % 36 === 0 ? 8 : 4;
    ticks.push(<line key={`y${y}`} y1={y} y2={y} x1={0} x2={len} />);
  }
  const pt = (x: number, y: number) => applyCalibration({ x, y, width: 0, height: 0 }, c);
  const corners = [pt(72, 72), pt(w - 72, 72), pt(72, h - 72), pt(w - 72, h - 72)];
  const ref = pt(144, h / 2);
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={w * zoom}
      height={h * zoom}
      viewBox={`0 0 ${w} ${h}`}
    >
      <g stroke="var(--ink)" strokeWidth={0.4} fill="var(--ink)" fontFamily="var(--font-mono)">
        {ticks}
      </g>
      {[72, w - 72].map((x) => (
        <line
          key={`vx${x}`}
          x1={x}
          x2={x}
          y1={0}
          y2={h}
          stroke="var(--info)"
          strokeWidth={0.3}
          strokeDasharray="2 3"
        />
      ))}
      {[72, h - 72].map((y) => (
        <line
          key={`hy${y}`}
          y1={y}
          y2={y}
          x1={0}
          x2={w}
          stroke="var(--info)"
          strokeWidth={0.3}
          strokeDasharray="2 3"
        />
      ))}
      <g stroke="var(--destructive)" strokeWidth={0.6} fill="none">
        {corners.map((p, i) => (
          <g key={i}>
            <line x1={p.x - 10} x2={p.x + 10} y1={p.y} y2={p.y} />
            <line x1={p.x} x2={p.x} y1={p.y - 10} y2={p.y + 10} />
            <circle cx={p.x} cy={p.y} r={4} />
          </g>
        ))}
      </g>
      <line
        x1={ref.x}
        x2={ref.x + 144 * c.scaleX}
        y1={ref.y}
        y2={ref.y}
        stroke="var(--ink)"
        strokeWidth={1}
      />
      <text x={ref.x} y={ref.y + 10} fontSize={7} fill="var(--ink)" fontFamily="var(--font-sans)">
        Reference line — must print at exactly 2.00 in
      </text>
    </svg>
  );
}
