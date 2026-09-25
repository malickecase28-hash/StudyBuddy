"use client";

/** Last-resort error screen. Red is reserved for genuine system faults like this one. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <h1 style={{ color: "#b42318" }}>Something went wrong in the workspace.</h1>
        <p>Your progress is saved locally. Try again, and if it keeps happening, export your progress from Settings.</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
