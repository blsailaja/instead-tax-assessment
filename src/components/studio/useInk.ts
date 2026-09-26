import { useEffect, useRef, useState } from "react";
import type { Page, Rect } from "@/lib/annotation/types";

type Raster = { w: number; h: number; data: Uint8ClampedArray; pw: number; ph: number };

/** Rasterises page images once so validation can detect boxes sitting on printed form content. */
export function useInk(pages: Page[]) {
  const [rasters, setRasters] = useState<Record<number, Raster>>({});
  const cache = useRef(new Map<string, number>());
  const key = pages.map((p) => p.image?.slice(0, 80)).join("|");

  useEffect(() => {
    let alive = true;
    cache.current.clear();
    setRasters({});
    pages.forEach((p) => {
      if (!p.image) return;
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        setRasters((r) => ({
          ...r,
          [p.index]: { w: c.width, h: c.height, data: d, pw: p.width, ph: p.height },
        }));
      };
      img.src = p.image;
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (page: number, r: Rect): number | undefined => {
    const ras = rasters[page];
    if (!ras) return undefined;
    const k = `${page}:${r.x}:${r.y}:${r.width}:${r.height}`;
    const hit = cache.current.get(k);
    if (hit !== undefined) return hit;
    const sx = ras.w / ras.pw;
    const sy = ras.h / ras.ph;
    const inset = 1.5;
    const x0 = Math.max(0, Math.floor((r.x + inset) * sx));
    const y0 = Math.max(0, Math.floor((r.y + inset) * sy));
    const x1 = Math.min(ras.w, Math.ceil((r.x + r.width - inset) * sx));
    const y1 = Math.min(ras.h, Math.ceil((r.y + r.height - inset) * sy));
    let dark = 0;
    let total = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * ras.w + x) * 4;
        const lum = 0.3 * ras.data[i] + 0.59 * ras.data[i + 1] + 0.11 * ras.data[i + 2];
        if (lum < 150) dark++;
        total++;
      }
    }
    const ratio = total ? dark / total : 0;
    cache.current.set(k, ratio);
    return ratio;
  };
}
