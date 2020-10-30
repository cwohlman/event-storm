import {
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.75.0/testing/asserts.ts";

import type { AbstractDatabase } from "./types.ts";

class TestDocument {
  constructor(
    public name: string
  ) {}
}

class OtherDocument {
  constructor(
    public whyNotMe: string
  ) {}
}

class RangeDocument {
  constructor(
    public index: number
  ) {}
}

async function setupDb(makeDb: () => AbstractDatabase | Promise<AbstractDatabase>) {
  const db = await makeDb()

  db.serializer.registerType('test', TestDocument)
  db.serializer.registerType('other', OtherDocument)
  db.serializer.registerType('range', RangeDocument)

  return db;
}

export function shouldReturnItemsByType(makeDb: () => AbstractDatabase | Promise<AbstractDatabase>) {
  return async () => {
    const db = await setupDb(makeDb)

    await db.insertDocuments([new TestDocument('one')])
    await db.insertDocuments([new OtherDocument('expected test document to be fetched')])

    const results = await db.getCursor().filterByType(TestDocument).fetch()

    assertEquals(results, [new TestDocument('one')])
  }
}

export function shouldReturnItemsByKey(makeDb: () => AbstractDatabase | Promise<AbstractDatabase>) {
  return async () => {
    const db = await setupDb(makeDb)

    await db.insertDocuments([new TestDocument('one')])
    await db.insertDocuments([new TestDocument('not the one expected')])

    const results = await db.getCursor().filterByKey('one', (a: unknown) => a && (a as { name?: string }).name || '').fetch()

    assertEquals(results, [new TestDocument('one')])
  }
}

export function shouldReturnItemsByRange(makeDb: () => AbstractDatabase | Promise<AbstractDatabase>) {
  return async () => {
    const db = await setupDb(makeDb)

    await db.insertDocuments([new RangeDocument(1)])
    await db.insertDocuments([new RangeDocument(2)])
    await db.insertDocuments([new RangeDocument(3)])

    const results = await db.getCursor().filterByRange({ gt: 1 }, (a: unknown) => a && (a as { index?: number }).index || -1).fetch()

    assertEquals(results, [new RangeDocument(2), new RangeDocument(3)])
  }
}


// should sort items
// should return items by type
// should return items matching a query
// should return items by range
// should redact (delete) items
// test performance of using query hints
// should block types
// should return items by instance of
// should return items by gt/lt index

// should warn when registering a type & a sub-type of said type
//        since every object can have only one stored type this should not be allowed