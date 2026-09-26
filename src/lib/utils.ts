import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (typeof window !== "undefined") {
    const base = window.location.pathname.startsWith("/instead-tax-assessment")
      ? "/instead-tax-assessment"
      : "";
    if (url.startsWith("/")) {
      return `${base}${url}`;
    }
  }
  return url;
}
