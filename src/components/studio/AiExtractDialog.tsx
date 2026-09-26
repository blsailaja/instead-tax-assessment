import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileSearch, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractCandidates } from "@/lib/annotation/extract.functions";
import type { ExtractionCandidate } from "@/lib/annotation/extract.types";
import { setDataPath } from "@/lib/annotation/data";
import type { Studio } from "./useStudio";

async function imageData(file: File) {
  if (file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const images: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(doc.numPages, 4); pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1500 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not render this PDF");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.82));
    }
    return images;
  }
  return [
    await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read this image"));
      reader.readAsDataURL(file);
    }),
  ];
}

export function AiExtractDialog({
  s,
  open,
  onOpenChange,
}: {
  s: Studio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const runExtraction = useServerFn(extractCandidates);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<ExtractionCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fields = useMemo(
    () =>
      s.template.fields.flatMap((field) =>
        "path" in field.source && field.source.path
          ? [{ id: field.id, label: field.label, path: field.source.path, type: field.type }]
          : [],
      ),
    [s.template],
  );

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await runExtraction({ data: { images: await imageData(file), fields } });
      setCandidates(rows);
      setSelected(new Set(rows.map((_, index) => index)));
      toast.success(`Found ${rows.length} candidate values`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document extraction failed");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    let next: unknown = s.data;
    candidates.forEach((candidate, index) => {
      if (selected.has(index)) next = setDataPath(next, candidate.path, candidate.value);
    });
    s.setDataText(JSON.stringify(next, null, 2));
    toast.success(`Applied ${selected.size} reviewed values`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extract client document</DialogTitle>
          <DialogDescription>
            Lovable AI proposes mappings. Review every value before applying it to return data. The
            document is not saved.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setCandidates([]);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-28 w-full items-center justify-center gap-3 rounded-sm border border-dashed border-input bg-muted/40 text-sm hover:bg-muted"
        >
          <FileSearch className="h-5 w-5" />
          <span>{file ? file.name : "Choose a client PDF or image"}</span>
        </button>
        {candidates.length > 0 && (
          <div className="divide-y rounded-sm border">
            {candidates.map((candidate, index) => (
              <label
                key={`${candidate.fieldId}-${index}`}
                className="flex gap-3 p-3 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(index)}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(index)) {
                        next.delete(index);
                      } else {
                        next.add(index);
                      }
                      return next;
                    })
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm">{candidate.fieldId}</strong>
                    <span className="font-mono text-xs text-muted-foreground">
                      {Math.round(candidate.confidence * 100)}%
                    </span>
                  </span>
                  <span className="block truncate font-mono text-xs">
                    {String(candidate.value ?? "")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Page {candidate.page} · {candidate.evidence}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {candidates.length ? (
            <Button onClick={apply} disabled={!selected.size}>
              Apply reviewed values
            </Button>
          ) : (
            <Button onClick={analyze} disabled={!file || busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}Analyze
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
