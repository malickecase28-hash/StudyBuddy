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

export async function load(key: string): Promise<unknown> {
  try {
    return (await getDb().kv.get(key))?.value ?? null;
  } catch {
    return null;
  }
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    await getDb().kv.put({ key, value });
  } catch {
    // Storage unavailable (private mode, quota): the session still works in memory.
  }
}
