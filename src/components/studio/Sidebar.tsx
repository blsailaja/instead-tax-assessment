import { useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Studio } from "./useStudio";
import { inputCls } from "./Inspector";

export function Sidebar({ s }: { s: Studio }) {
  const [tab, setTab] = useState<"fields" | "data">("fields");
  const [q, setQ] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);

  const counts = useMemo(() => {
    let e = 0;
    let w = 0;
    for (const r of s.reports) {
      if (r.allIssues.some((i) => i.severity === "error")) e++;
      else if (r.allIssues.some((i) => i.severity === "warning")) w++;
    }
    return { e, w };
  }, [s.reports]);

  const list = s.reports.filter((r) => {
    const f = r.field;
    if (onlyIssues && !r.allIssues.some((i) => i.severity !== "info")) return false;
    const hay =
      `${f.id} ${f.label} ${f.line ?? ""} ${"path" in f.source ? f.source.path : ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <aside className="flex min-h-0 w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex border-b border-border text-sm">
        {(["fields", "data"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 capitalize text-muted-foreground",
              tab === t && "border-b-2 border-ink font-medium text-foreground",
            )}
          >
            {t === "fields" ? `Fields · ${s.template.fields.length}` : "Return data"}
          </button>
        ))}
      </div>

      {tab === "fields" ? (
        <>
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <input
                className={inputCls + " pl-8"}
                placeholder="Search id, label, line, path"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-destructive">
                <AlertOctagon className="h-3.5 w-3.5" /> {counts.e}
              </span>
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" /> {counts.w}
              </span>
              <label className="ml-auto flex items-center gap-1.5 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={onlyIssues}
                  onChange={(e) => setOnlyIssues(e.target.checked)}
                />
                issues only
              </label>
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list.map((r) => {
              const f = r.field;
              const err = r.allIssues.some((i) => i.severity === "error");
              const warn = !err && r.allIssues.some((i) => i.severity === "warning");
              return (
                <li key={f.id}>
                  <button
                    onClick={() => {
                      s.setSelectedId(f.id);
                      s.setPage(f.page);
                      s.setMode("annotate");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left hover:bg-muted",
                      s.selectedId === f.id && "bg-accent/40 hover:bg-accent/40",
                    )}
                  >
                    <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">
                      {f.line ?? `p${f.page + 1}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{f.label}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {f.id}
                      </span>
                    </span>
                    {err && <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />}
                    {warn && <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />}
                  </button>
                </li>
              );
            })}
            {!list.length && (
              <li className="p-4 text-sm text-muted-foreground">No fields match.</li>
            )}
          </ul>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            A deeply nested tax return. Field paths such as{" "}
            <code className="font-mono">income.w2[*].wages</code> resolve against this JSON live.
          </p>
          <textarea
            spellCheck={false}
            className={cn(
              "min-h-0 flex-1 resize-none rounded-sm border bg-card p-2 font-mono text-[11px] leading-relaxed outline-none focus:ring-1 focus:ring-ring",
              s.dataError ? "border-destructive" : "border-input",
            )}
            value={s.dataText}
            onChange={(e) => s.setDataText(e.target.value)}
          />
          {s.dataError && (
            <p className="mt-2 text-xs text-destructive">Invalid JSON: {s.dataError}</p>
          )}
        </div>
      )}
    </aside>
  );
}
