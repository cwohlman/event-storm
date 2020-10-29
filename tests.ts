import {
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.75.0/testing/asserts.ts";

import type {Database} from './types.ts'

export function insertAndQuery<R>(database: Database<R>) {
  return async () => {
    database.insert({ value: 100 })

    const cursor = database.source((p): p is { value: number } => p && typeof p === 'object' && 'value' in p)

    const result = database.fetch(cursor)

    assertEquals(result, [{ value: 100 }])
  }
}

export function sort<R>(database: Database<R>) {
  return async () => {
    database.insert({ value: 100 })
    database.insert({ value: 99 })

    const cursor = database.source((p): p is { value: number } => p && typeof p === 'object' && 'value' in p)

    const sorted = database.sort(cursor, ['asc', (a: { value: number }) => a.value])

    const result = database.fetch(sorted)

    assertEquals(result, [{ value: 99 }, { value: 100 }])
  }
}