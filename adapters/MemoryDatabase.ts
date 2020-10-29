import { Cursor, CursorType, Database, Filter, Query, Sort } from "../types.ts";

export class MemoryCursor<T> implements Cursor<T> {
  _type(): T { throw new Error('Not intended to be called, for typing only'); }

  constructor(private data: T[]) {}

  filter<TOut>(filter: Filter<TOut>): MemoryCursor<TOut> {
    return new MemoryCursor<TOut>((this.data as unknown[]).filter(filter))
  }
  query(query: Query<T>): MemoryCursor<T> {
    return new MemoryCursor<T>(this.data.map(p => ({ key: query[1](p), value: p})).filter(p => p.key === query[0]).map(p => p.value))
  }
  sort(sort: Sort<T>): MemoryCursor<T> {
    return new MemoryCursor<T>(this.data.concat().sort((a, b): number => {
      const sortKeyA = sort[1](a)
      const sortKeyB = sort[1](b)

      if (sortKeyA > sortKeyB) {
        return sort[0] === 'asc' ? -1 : 1
      }

      if (sortKeyB > sortKeyA) {
        return sort[0] === 'desc' ? 1 : -1
      }

      return 0
    }))
  }
  fetch() {
    return this.data.concat()
  }
}
// deno-lint-ignore no-explicit-any
export class MemoryDatabase implements Database<MemoryCursor<any>> {

  constructor(
    private data: unknown[]
  ) { }

  source<T>(filter: Filter<T>): MemoryCursor<T> {
    return new MemoryCursor(this.data).filter(filter)
  }
  query<T>(cursor: MemoryCursor<T>, query: Query<T>): MemoryCursor<T> {
    return cursor.query(query)
  }
  sort<T>(cursor: MemoryCursor<T>, sort: Sort<T>): MemoryCursor<T> {
    return cursor.sort(sort)
  }

  insert<T>(document: T): void | Promise<void> {
    this.data.push(document)
  }
  redact<T>(cursor: CursorType<MemoryCursor<any>, T>): void | Promise<void> {
    throw new Error('Method not implemented.');
  }
  fetch<T>(cursor: MemoryCursor<T>): T[] {
    return cursor.fetch()
  }
}

