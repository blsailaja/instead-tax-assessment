import { useEffect, useState } from "react";
import { Copy, FolderOpen, History, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteSavedTemplate,
  duplicateSavedTemplate,
  readTemplateLibrary,
  renameSavedTemplate,
  saveTemplateVersion,
  type SavedTemplate,
} from "@/lib/annotation/templateLibrary";
import type { Studio } from "./useStudio";
import { inputCls } from "./Inspector";

export function TemplateLibraryDialog({
  s,
  open,
  onOpenChange,
}: {
  s: Studio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<SavedTemplate[]>([]);
  const [name, setName] = useState(s.template.form.name);
  const [activeId, setActiveId] = useState<string | undefined>();
  useEffect(() => {
    if (open) {
      setItems(readTemplateLibrary());
      setName(s.template.form.name);
    }
  }, [open, s.template.form.name]);
  const save = () => {
    if (!name.trim()) return;
    const next = saveTemplateVersion(items, {
      id: activeId,
      name,
      template: s.template,
      calibration: s.calibration,
    });
    setItems(next);
    setActiveId(next.find((item) => item.name === name.trim())?.id);
    toast.success(activeId ? "New version saved" : "Template saved");
  };
  const openVersion = (item: SavedTemplate, versionIndex: number) => {
    const version = item.versions[versionIndex];
    if (!version) return;
    s.setTemplate(version.template);
    s.setCalibration(version.calibration);
    setActiveId(item.id);
    setName(item.name);
    onOpenChange(false);
    toast.success(`Opened ${item.name} · version ${versionIndex + 1}`);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template library</DialogTitle>
          <DialogDescription>
            Saved locally in this browser. Versions include field mappings and calibration, never
            client return data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Template name"
          />
          <Button onClick={save}>
            <Save />
            {activeId ? "Save version" : "Save template"}
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <section key={item.id} className="rounded-sm border p-3">
              <div className="flex items-center gap-2">
                <input
                  className={inputCls}
                  defaultValue={item.name}
                  onBlur={(event) =>
                    setItems(renameSavedTemplate(items, item.id, event.target.value))
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  title="Duplicate"
                  onClick={() => setItems(duplicateSavedTemplate(items, item.id))}
                >
                  <Copy />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Delete"
                  onClick={() => setItems(deleteSavedTemplate(items, item.id))}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {item.versions
                  .slice()
                  .reverse()
                  .map((version, reverseIndex) => {
                    const index = item.versions.length - 1 - reverseIndex;
                    return (
                      <button
                        type="button"
                        key={version.id}
                        onClick={() => openVersion(item, index)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span className="flex-1">
                          Version {index + 1} · {new Date(version.createdAt).toLocaleString()}
                        </span>
                        <FolderOpen className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
          {!items.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No saved templates yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
