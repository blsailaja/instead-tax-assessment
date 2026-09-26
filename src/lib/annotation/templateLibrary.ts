import type { Calibration, Template } from "./types";

export type TemplateVersion = {
  id: string;
  createdAt: string;
  note: string;
  template: Template;
  calibration: Calibration;
};

export type SavedTemplate = {
  id: string;
  name: string;
  updatedAt: string;
  versions: TemplateVersion[];
};

const KEY = "instead.template-library.v1";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function readTemplateLibrary(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedTemplate[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(items: SavedTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  return items;
}

export function saveTemplateVersion(
  items: SavedTemplate[],
  input: { id?: string; name: string; note?: string; template: Template; calibration: Calibration },
) {
  const now = new Date().toISOString();
  const version: TemplateVersion = {
    id: makeId(),
    createdAt: now,
    note: input.note?.trim() || "Saved version",
    template: clone(input.template),
    calibration: clone(input.calibration),
  };
  const existing = input.id ? items.find((item) => item.id === input.id) : undefined;
  const next = existing
    ? items.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              name: input.name.trim(),
              updatedAt: now,
              versions: [...item.versions, version],
            }
          : item,
      )
    : [...items, { id: makeId(), name: input.name.trim(), updatedAt: now, versions: [version] }];
  return write(next);
}

export function duplicateSavedTemplate(items: SavedTemplate[], id: string) {
  const source = items.find((item) => item.id === id);
  if (!source) return items;
  const now = new Date().toISOString();
  return write([
    ...items,
    {
      ...clone(source),
      id: makeId(),
      name: `${source.name} copy`,
      updatedAt: now,
      versions: source.versions.map((version) => ({ ...version, id: makeId(), createdAt: now })),
    },
  ]);
}

export function renameSavedTemplate(items: SavedTemplate[], id: string, name: string) {
  return write(
    items.map((item) =>
      item.id === id
        ? { ...item, name: name.trim() || item.name, updatedAt: new Date().toISOString() }
        : item,
    ),
  );
}

export function deleteSavedTemplate(items: SavedTemplate[], id: string) {
  return write(items.filter((item) => item.id !== id));
}
