"use client";

import { useStorageUnavailable } from "@/lib/ink-store";

/** Shown when the browser won't store pages: work continues in this tab, and export still keeps a copy. */
export function StorageBanner() {
  if (!useStorageUnavailable()) return null;
  return (
    <div className="fb fb-again" role="status">
      This browser isn't saving pages right now, so your work lives only in this tab. Export a page to keep a copy.
    </div>
  );
}
