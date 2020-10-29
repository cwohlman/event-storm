export type Filter<T> = (input: unknown) => input is T
export type Mapper<I, O> = (input: I) => O
export type Query<T> = [string, Mapper<T, string>]
export type Sort<T> = ['asc' | 'desc', Mapper<T, string | number | boolean>]
export type Insert<T> = [string, T]
export type Cursor<TKind> = { _type(): TKind }

// TODO: ordered set operations
// TODO: graph operations

// Warning! Fancy typescript syntax ahead
//          CursorType<R> means something that satisfies both Cursor<T> and R
//          This prevents cursors from being used in the wrong database (e.g. using a memory cursor in a mongo backed database)

export type CursorType<R, T> = Cursor<T> & R
export interface Database<R> {
  // registerClass<T>(def: )

  source<T>(filter: Filter<T>): CursorType<R, T>
  query<T>(cursor: CursorType<R, T>, query: Query<T>): CursorType<R, T>
  sort<T>(cursor: CursorType<R, T>, sort: Sort<T>): CursorType<R, T>

  insert<T>(document: T): Promise<void> | void
  redact<T>(cursor: CursorType<R, T>): Promise<void> | void
  fetch<T>(cursor: CursorType<R, T>): T[] | Promise<T[]>
}
