"use client";

import { useEffect, useRef } from "react";

/** A native modal dialog asking to confirm a destructive action. Open while `message` is set. */
export function ConfirmDialog({ message, confirm = "Delete", onConfirm, onClose }: { message: string | null; confirm?: string; onConfirm: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (message && !d.open) d.showModal();
    else if (!message && d.open) d.close();
  }, [message]);
  return (
    <dialog ref={ref} onClose={onClose} className="card m-auto max-w-sm space-y-4 p-5" aria-label="Confirm">
      <p>{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={onClose} autoFocus>Cancel</button>
        <button className="btn btn-primary" onClick={() => { onConfirm(); onClose(); }}>{confirm}</button>
      </div>
    </dialog>
  );
}
