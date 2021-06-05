import { bigint, defineDb, defineTable } from "./mod.ts";

export const foo = defineTable({
  id: bigint<BigInt>().notNull(),
});

const db = defineDb({ foo }, async (query: string, parameters: any[]) => {
  console.log(query, parameters);
  return await { rows: [""], affectedCount: 1 };
});

const rows = await db.select(db.foo.id).from(db.foo).where(db.foo.id.eq(1n));

console.log(rows);
