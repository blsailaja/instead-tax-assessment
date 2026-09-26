export function setDataPath(root: unknown, path: string, value: unknown): unknown {
  if (!path || path.includes("*") || path.includes("[?")) return root;
  const parts = path.replace(/^\$\.?/, "").match(/[^.[\]]+/g) ?? [];
  if (!parts.length) return root;
  const out = structuredClone(root && typeof root === "object" ? root : {});
  let cursor = out as Record<string, unknown>;
  parts.forEach((part, index) => {
    const last = index === parts.length - 1;
    if (last) cursor[part] = value;
    else {
      const next = cursor[part];
      if (!next || typeof next !== "object" || Array.isArray(next)) cursor[part] = {};
      cursor = cursor[part] as Record<string, unknown>;
    }
  });
  return out;
}
