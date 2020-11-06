import { Database } from "https://raw.githubusercontent.com/cwohlman/denodb/master/mod.ts"

import {
  shouldReturnItemsByKey,
  shouldReturnItemsByRange,
  shouldReturnItemsByType,
} from "../tests.ts";
import { DenoDbDatabase } from "./DenoDbDatabase.ts";

const createDb = async () => {
  const db = new DenoDbDatabase(
    new Database({
      dialect: "postgres",
    }, {
      database: "postgres",
      host: "127.0.0.1",
      username: "postgres",
      password: "postgrespassword",
      port: 3018,
    }),
    "test-event-storm",
  );

  await db.resetDb();

  return db;
};
Deno.test(
  "DenoDbDatabase - should return items by type",
  async () => {
    const db = await createDb()
    await shouldReturnItemsByType(() => db)()
    await db.close()
  },
  
);
Deno.test(
  "DenoDbDatabase - should return items by key",
  async () => {
    const db = await createDb()
    await shouldReturnItemsByKey(() => db)()
    await db.close()
  },
);
Deno.test(
  "DenoDbDatabase - should return items by range",
  async () => {
    const db = await createDb()
    await shouldReturnItemsByRange(() => db)()
    await db.close()
  },
);
