import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { Issue } from "@/lib/annotation/layout";
import { cn } from "@/lib/utils";

export function IssueList({ issues, className }: { issues: Issue[]; className?: string }) {
  return (
    <ul className={cn("space-y-1", className)}>
      {issues.map((i, k) => {
        const Icon =
          i.severity === "error" ? AlertOctagon : i.severity === "warning" ? AlertTriangle : Info;
        return (
          <li
            key={k}
            className={cn(
              "flex items-start gap-1.5 text-xs",
              i.severity === "error" && "text-destructive",
              i.severity === "warning" && "text-warning",
              i.severity === "info" && "text-muted-foreground",
            )}
          >
            <Icon className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-mono">{i.code}</span> — {i.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
