import Dexie, { type Table } from "dexie";

type Row = { key: string; value: unknown };

class StudyDb extends Dexie {
  kv!: Table<Row, string>;
  constructor() {
    super("studybuddy");
    this.version(1).stores({ kv: "key" });
  }
}

let db: StudyDb | null = null;
const getDb = () => (db ??= new StudyDb());

export const TIMED_OUT = Symbol("timed-out");

/** Read a value; resolves to TIMED_OUT if storage doesn't answer (e.g. blocked by another tab). */
export async function load(key: string, timeoutMs = 4000): Promise<unknown> {
  const read = (async () => {
    try {
      return (await getDb().kv.get(key))?.value ?? null;
    } catch {
      return null;
    }
  })();
  const timeout = new Promise<typeof TIMED_OUT>((r) => setTimeout(() => r(TIMED_OUT), timeoutMs));
  return Promise.race([read, timeout]);
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    await getDb().kv.put({ key, value });
  } catch {
    // Storage unavailable (private mode, quota): the session still works in memory.
  }
}
