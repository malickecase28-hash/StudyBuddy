import type { Diagnostic, DiagnosticItem } from "./schema/diagnostic";

export type DiagnosticAnswers = Record<string, boolean>;
export type TopicResult = "ready" | "partial" | "gap";

const item = (d: Diagnostic, topic: string, role: "core" | "probe") => d.items.find((i) => i.topic === topic && i.role === role);

export function nextDiagnosticItem(d: Diagnostic, answers: DiagnosticAnswers): DiagnosticItem | null {
  for (const t of d.topics) {
    const core = item(d, t.id, "core");
    if (!core) continue;
    if (!(core.id in answers)) return core;
    const probe = item(d, t.id, "probe");
    if (!answers[core.id] && probe && !(probe.id in answers)) return probe;
  }
  return null;
}

export function topicResult(d: Diagnostic, topicId: string, answers: DiagnosticAnswers): TopicResult {
  const core = item(d, topicId, "core");
  if (core && answers[core.id]) return "ready";
  const probe = item(d, topicId, "probe");
  return probe && answers[probe.id] ? "partial" : "gap";
}

export function diagnosticRoute(d: Diagnostic, answers: DiagnosticAnswers): { results: Record<string, TopicResult>; route: string[] } {
  const results: Record<string, TopicResult> = {};
  const route: string[] = [];
  for (const t of d.topics) {
    const r = topicResult(d, t.id, answers);
    results[t.id] = r;
    if (r !== "ready" && t.refresher && !route.includes(t.refresher)) route.push(t.refresher);
  }
  return { results, route };
}
