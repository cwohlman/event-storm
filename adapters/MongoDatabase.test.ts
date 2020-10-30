import {
  shouldReturnItemsByKey,
  shouldReturnItemsByRange,
  shouldReturnItemsByType,
} from "../tests.ts";
import { MongoDatabase } from "./MongoDatabase.ts";

const makeDb = async () => {
  const db = new MongoDatabase("mongodb://localhost:3017", "deno-test", "events");

  await db._collection.deleteMany({})

  return db;
};
Deno.test(
  "MongoDatabase - should return items by type",
  shouldReturnItemsByType(makeDb),
);
Deno.test(
  "MongoDatabase - should return items by key",
  shouldReturnItemsByKey(makeDb),
);
Deno.test(
  "MongoDatabase - should return items by range",
  shouldReturnItemsByRange(makeDb),
);
