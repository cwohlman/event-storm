import { shouldReturnItemsByKey, shouldReturnItemsByRange, shouldReturnItemsByType } from "../tests.ts";
import { MemoryDatabase } from "./MemoryDatabase.ts";

Deno.test('MemoryDatabase - should return items by type', shouldReturnItemsByType(() => new MemoryDatabase([])))
Deno.test('MemoryDatabase - should return items by key', shouldReturnItemsByKey(() => new MemoryDatabase([])))
Deno.test('MemoryDatabase - should return items by range', shouldReturnItemsByRange(() => new MemoryDatabase([])))