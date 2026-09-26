const LETTERS: { x: number; d: string[]; evenodd?: boolean }[] = [
  { x: 0, d: ["M0 0 H84 A12 12 0 0 1 84 24 H0 Z", "M0 120 V58 A24 24 0 0 1 24 34 H72 A12 12 0 0 1 72 58 H24 V120 Z"] },
  { x: 116, d: ["M60 0 A60 60 0 1 1 59.99 0 Z M60 24 A36 36 0 1 0 60.01 24 Z"], evenodd: true },
  { x: 256, d: ["M0 0 H24 V120 H0 Z", "M24 0 H62 A34 34 0 0 1 62 68 H24 V44 H62 A10 10 0 0 0 62 24 H24 Z", "M42 68 H68 L102 120 H76 Z"] },
  { x: 378, d: ["M0 120 V0 H22 L60 42 L98 0 H120 V120 H96 V38 L60 78 L24 38 V120 Z"] },
  { x: 518, d: ["M0 120 L44 0 H68 L112 120 H86 L56 36 L26 120 Z"] },
];

/** Titled: an image with a name. Untitled: decorative, hidden from assistive tech. */
const a11y = (title: string) => (title ? { role: "img", "aria-label": title } : { "aria-hidden": true });

const glyph = (l: (typeof LETTERS)[number]) => (
  <g key={l.x} transform={`translate(${l.x} 0)`}>
    {l.d.map((d) => (
      <path key={d} d={d} fillRule={l.evenodd ? "evenodd" : undefined} />
    ))}
  </g>
);

/** FORMA on the 120-unit cap grid. `height` is the rendered height in px (cap ≥ 16 px ⇒ height ≥ 19). */
export function Wordmark({ height = 20, title = "Forma" }: { height?: number; title?: string }) {
  return (
    <svg viewBox="-12 -12 654 144" height={height} fill="currentColor" {...a11y(title)}>
      {LETTERS.map(glyph)}
    </svg>
  );
}

/** The F alone: favicon, app icon, avatar fallback. */
export function Mark({ size = 24, title = "Forma" }: { size?: number; title?: string }) {
  return (
    <svg viewBox="-12 -12 120 144" height={size} fill="currentColor" {...a11y(title)}>
      {glyph(LETTERS[0]!)}
    </svg>
  );
}
