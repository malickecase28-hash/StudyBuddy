export type Command = { id: string; label: string; group: string; keywords?: string };

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Every query term must prefix some word; label-prefix beats word-prefix beats the rest; ties keep input order. */
export function rankCommands<C extends Command>(query: string, commands: readonly C[], limit = 12): C[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice(0, limit);
  const terms = words(q);
  return commands
    .flatMap((c, i) => {
      const hay = words(`${c.label} ${c.keywords ?? ""} ${c.group}`);
      if (!terms.every((t) => hay.some((w) => w.startsWith(t)))) return [];
      const label = c.label.toLowerCase();
      const score = label.startsWith(q) ? 0 : words(label).some((w) => w.startsWith(terms[0]!)) ? 1 : 2;
      return [{ c, i, score }];
    })
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .slice(0, limit)
    .map((s) => s.c);
}
