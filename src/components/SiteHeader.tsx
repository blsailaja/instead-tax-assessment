import { Link } from "@tanstack/react-router";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const link = "px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors";
  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-2">
      <Link to="/" className="flex items-center gap-2" aria-label="INSTEAD Form Studio home">
        <span className="grid h-6 w-6 place-items-center rounded-sm bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
          IN
        </span>
        <span className="font-serif text-base font-semibold">INSTEAD</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">Form Studio</span>
      </Link>
      <nav className="flex items-center">
        <Link
          to="/studio"
          className={link}
          activeProps={{ className: "text-foreground font-medium" }}
        >
          Studio
        </Link>
        <Link
          to="/spec"
          className={link}
          activeProps={{ className: "text-foreground font-medium" }}
        >
          Specification
        </Link>
        <Link
          to="/walkthrough"
          className="ml-1 inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary/90" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Video Walkthrough
        </Link>
      </nav>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{children}</div>
    </header>
  );
}
