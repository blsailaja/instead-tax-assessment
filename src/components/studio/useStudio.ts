import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import templateJson from "@/data/f1040.template.json";
import sampleJson from "@/data/sample-return.json";
import type { Calibration, Field, Template } from "@/lib/annotation/types";
import { DEFAULT_CALIBRATION } from "@/lib/annotation/types";
import { geometryIssues, layoutField, type Issue, type Rendered } from "@/lib/annotation/layout";
import { resolveAssetUrl } from "@/lib/utils";
import { useInk } from "./useInk";

export const BASE_TEMPLATE = templateJson as unknown as Template;
const LS = "tfas.studio.v1";

export type Mode = "annotate" | "preview" | "calibrate";
export type Tool = "select" | "draw";
export type FieldReport = Rendered & { allIssues: Issue[] };

export function useStudio() {
  const [template, setTemplate] = useState<Template>(BASE_TEMPLATE);
  const past = useRef<Template[]>([]);
  const future = useRef<Template[]>([]);
  const transaction = useRef<Template | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const [dataText, setDataText] = useState(() => JSON.stringify(sampleJson, null, 2));
  const [calibration, setCalibration] = useState<Calibration>(DEFAULT_CALIBRATION);
  const [sourceBytes, setSourceBytes] = useState<ArrayBuffer | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<Mode>("annotate");
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1.35);
  const [loaded, setLoaded] = useState(false);

  // Restore after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.template) setTemplate(s.template);
        if (s.dataText) setDataText(s.dataText);
        if (s.calibration) setCalibration(s.calibration);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS, JSON.stringify({ template, dataText, calibration }));
      } catch {
        // Imported page images can exceed quota; keep working in-memory.
      }
    }, 300);
    return () => clearTimeout(id);
  }, [template, dataText, calibration, loaded]);

  const { data, dataError } = useMemo(() => {
    try {
      return { data: JSON.parse(dataText) as unknown, dataError: null as string | null };
    } catch (e) {
      return { data: {}, dataError: (e as Error).message };
    }
  }, [dataText]);

  const ink = useInk(template.pages);

  const reports: FieldReport[] = useMemo(
    () =>
      template.fields.map((f) => {
        const r = layoutField(template, f, data);
        const geo = geometryIssues(template, f, { calibration, inkRatio: ink(f.page, f.rect) });
        return { ...r, allIssues: [...geo, ...r.issues] };
      }),
    // ink identity changes whenever rasters load
    [template, data, calibration, ink],
  );

  const selected = template.fields.find((f) => f.id === selectedId) ?? null;

  const commitTemplate = useCallback((action: SetStateAction<Template>) => {
    setTemplate((current) => {
      const next = typeof action === "function" ? action(current) : action;
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      if (!transaction.current) {
        past.current = [...past.current.slice(-49), current];
        future.current = [];
        setHistoryTick((n) => n + 1);
      }
      return next;
    });
  }, []);

  const beginHistory = useCallback(() => {
    setTemplate((current) => {
      transaction.current ??= current;
      return current;
    });
  }, []);

  const endHistory = useCallback(() => {
    const before = transaction.current;
    transaction.current = null;
    if (before && JSON.stringify(before) !== JSON.stringify(template)) {
      past.current = [...past.current.slice(-49), before];
      future.current = [];
      setHistoryTick((n) => n + 1);
    }
  }, [template]);

  const undo = useCallback(() => {
    setTemplate((current) => {
      const previous = past.current.at(-1);
      if (!previous) return current;
      past.current = past.current.slice(0, -1);
      future.current = [current, ...future.current].slice(0, 50);
      setHistoryTick((n) => n + 1);
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setTemplate((current) => {
      const next = future.current[0];
      if (!next) return current;
      future.current = future.current.slice(1);
      past.current = [...past.current.slice(-49), current];
      setHistoryTick((n) => n + 1);
      return next;
    });
  }, []);

  const updateField = useCallback(
    (id: string, patch: Partial<Field>) => {
      commitTemplate((t) => ({
        ...t,
        fields: t.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      }));
    },
    [commitTemplate],
  );
  const renameField = useCallback(
    (id: string, next: string) => {
      commitTemplate((t) => ({
        ...t,
        fields: t.fields.map((f) => (f.id === id ? { ...f, id: next } : f)),
      }));
      setSelectedId(next);
    },
    [commitTemplate],
  );
  const addField = useCallback(
    (f: Field) => {
      commitTemplate((t) => ({ ...t, fields: [...t.fields, f] }));
      setSelectedId(f.id);
    },
    [commitTemplate],
  );
  const removeField = useCallback(
    (id: string) => {
      commitTemplate((t) => ({ ...t, fields: t.fields.filter((f) => f.id !== id) }));
      setSelectedId(null);
    },
    [commitTemplate],
  );

  const reset = () => {
    commitTemplate(BASE_TEMPLATE);
    setDataText(JSON.stringify(sampleJson, null, 2));
    setCalibration(DEFAULT_CALIBRATION);
    setSourceBytes(null);
    setSelectedId(null);
    setPage(0);
  };

  const getSourceBytes = async () => {
    if (sourceBytes) return sourceBytes;
    if (!template.form.source) return null;
    const resolvedUrl = resolveAssetUrl(template.form.source);
    const b = await fetch(resolvedUrl).then((r) => r.arrayBuffer());
    setSourceBytes(b);
    return b;
  };

  return {
    template,
    setTemplate: commitTemplate,
    dataText,
    setDataText,
    data,
    dataError,
    calibration,
    setCalibration,
    sourceBytes,
    setSourceBytes,
    getSourceBytes,
    selectedId,
    setSelectedId,
    selected,
    page,
    setPage,
    mode,
    setMode,
    tool,
    setTool,
    zoom,
    setZoom,
    reports,
    updateField,
    renameField,
    addField,
    removeField,
    beginHistory,
    endHistory,
    undo,
    redo,
    canUndo: historyTick >= 0 && past.current.length > 0,
    canRedo: historyTick >= 0 && future.current.length > 0,
    reset,
  };
}

export type Studio = ReturnType<typeof useStudio>;

export function uniqueId(t: Template, base: string) {
  let id = base;
  let n = 2;
  while (t.fields.some((f) => f.id === id)) id = `${base}_${n++}`;
  return id;
}
