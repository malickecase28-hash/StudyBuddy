import type { Evaluated, Instance } from "./component";
import type { Registry } from "./component";

export type SceneState = Record<string, { params: Record<string, unknown>; visible: boolean }>;
export type Frame = Record<string, Evaluated>;

/**
 * Evaluates every instance's model in link order. Models are memoised on
 * (component, parsed params, upstream keys), so scrubbing and re-rendering are cheap.
 */
export function createEvaluator(registry: Registry, instances: readonly Instance[], cacheSize = 512): (state: SceneState) => Frame {
  const byId = new Map(instances.map((i) => [i.id, i]));
  const cache = new Map<string, Record<string, unknown>>();
  return (state) => {
    const out: Frame = {};
    const keys: Record<string, string> = {};
    const visiting = new Set<string>();
    const ev = (id: string): Evaluated => {
      const done = out[id];
      if (done) return done;
      if (visiting.has(id)) throw new Error(`Link cycle at instance "${id}"`);
      const inst = byId.get(id);
      if (!inst) throw new Error(`Unknown instance: ${id}`);
      visiting.add(id);
      const def = registry.get(inst.component);
      const s = state[id] ?? { params: inst.params, visible: inst.visible ?? false };
      const params = def.params.parse(s.params) as Record<string, unknown>;
      const upstream = Object.entries(inst.links ?? {})
        .map(([name, target]) => {
          ev(target);
          return `${name}=${keys[target]}`;
        })
        .join("|");
      const key = `${inst.component}|${JSON.stringify(params)}|${upstream}`;
      keys[id] = key;
      let model = cache.get(key);
      if (!model) {
        model = def.model(params, {
          link: (name) => {
            const target = inst.links?.[name];
            if (!target) throw new Error(`Instance "${id}" has no link "${name}"`);
            return ev(target);
          },
        }) as Record<string, unknown>;
        cache.set(key, model);
        if (cache.size > cacheSize) cache.delete(cache.keys().next().value as string);
      }
      const result: Evaluated = { params, model, visible: s.visible };
      out[id] = result;
      visiting.delete(id);
      return result;
    };
    for (const i of instances) ev(i.id);
    return out;
  };
}
