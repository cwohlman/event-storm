import { Serializer } from "./components/Serializer.ts";

export type Range = { gt: string | number } | { lt: string | number } | {
  gt: string | number;
  lt: string | number;
};

// TODO: IncrementalFetchCursor { fetchNext(): T | null | Promise<T | null> }

export interface StandardCursor<T> {
  fetch(): T[] | Promise<T[]>;
  // fetchIds(): string[] | Promise<string[]>

  filterByType<T>(Type: { new (...args: any[]): T }): StandardCursor<T>;

  filterByKey(key: string, map: (a: T) => string): StandardCursor<T>;

  filterByRange(
    range: Range,
    map: (a: T) => string | number,
  ): StandardCursor<T>;

  sortByKey(
    direction: "asc" | "desc",
    map: (a: T) => string,
  ): StandardCursor<T>;

  map<TOut>(map: (a: T) => TOut): StandardCursor<TOut>;
}

// TODO: ordered set operations
// TODO: graph operations
// TODO: aggregation

export type Indexes = { [key: string]: string | number };
export type RawDocument = { value: unknown; id: string; indexes?: Indexes };

export type FilterOp =
  | { type: "filterByType"; Type: { new (...args: any[]): any } }
  | { type: "filterByKey"; key: string; map: (a: any) => string }
  | { type: "filterByRange"; range: Range; map: (a: any) => string };

export type CursorOp =
  | FilterOp
  | {
    type: "sortByKey";
    direction: "asc" | "desc";
    map: (a: any) => string;
  }
  | { type: "map"; map: (a: any) => any };

export class PassthroughCursor<T> implements StandardCursor<T> {
  constructor(
    public readonly ops: CursorOp[],
    private readonly getDocuments: (
      filters: FilterOp[],
    ) => unknown[] | Promise<unknown[]>,
  ) {}

  async fetch(): Promise<T[]> {
    const filters: FilterOp[] = [];

    let i: number;
    for (i = 0; i < this.ops.length; i++) {
      const op = this.ops[i];
      if (
        op.type === "filterByType" || op.type === "filterByKey" ||
        op.type === "filterByRange"
      ) {
        filters.push(op);
      } else {
        break;
      }
    }

    const initialData = await this.getDocuments(filters);

    let currentSet = initialData;
    this.ops.forEach((op) => {
      if (op.type === "filterByKey") {
        currentSet = currentSet.filter((doc) => {
          const key = op.map(doc);
          return key === op.key;
        });
      }
      if (op.type === "filterByRange") {
        currentSet = currentSet.filter((doc) => {
          const key = op.map(doc);
          if ("gt" in op.range && !(key > op.range.gt)) {
            return false;
          }
          if ("lt" in op.range && !(key < op.range.lt)) {
            return false;
          }
          return true;
        });
      }
      if (op.type === "filterByType") {
        currentSet = currentSet.filter((doc) => {
          return doc instanceof op.Type;
        });
      }
      if (op.type === "sortByKey") {
        currentSet = currentSet.sort((a, b) => {
          const sortKeyA = op.map(a);
          const sortKeyB = op.map(b);

          if (sortKeyA > sortKeyB) return op.direction === "asc" ? -1 : 1;
          if (sortKeyA < sortKeyB) return op.direction === "asc" ? 1 : -1;

          return 0;
        });
      }
      if (op.type === "map") {
        currentSet = currentSet.map((doc) => op.map(doc));
      }
    });

    return currentSet as any;
  }

  filterByType<T>(Type: { new (...args: any[]): T }): PassthroughCursor<T> {
    return new PassthroughCursor<T>(
      this.ops.concat([{ type: "filterByType", Type }]),
      this.getDocuments,
    );
  }
  filterByKey(key: string, map: (a: T) => string): PassthroughCursor<T> {
    return new PassthroughCursor<T>(
      this.ops.concat([{ type: "filterByKey", key, map }]),
      this.getDocuments,
    );
  }
  filterByRange(
    range: Range,
    map: (a: T) => string,
  ): PassthroughCursor<T> {
    return new PassthroughCursor<T>(
      this.ops.concat([{ type: "filterByRange", range, map }]),
      this.getDocuments,
    );
  }
  sortByKey(
    direction: "asc" | "desc",
    map: (a: T) => string,
  ): PassthroughCursor<T> {
    return new PassthroughCursor<T>(
      this.ops.concat([{ type: "sortByKey", direction, map }]),
      this.getDocuments,
    );
  }
  map<TOut>(map: (a: T) => TOut): PassthroughCursor<TOut> {
    return new PassthroughCursor<TOut>(
      this.ops.concat([{ type: "map", map }]),
      this.getDocuments,
    );
  }

  // TODO: reduce
}

// TODO: IDatabase
export abstract class AbstractDatabase {
  serializer = new Serializer();

  getCursor(): StandardCursor<unknown> {
    const resolve = (
      filters: FilterOp[],
    ) => {
      return this.queryByFilter(filters);
    };
    return new PassthroughCursor([], resolve);
  }

  async insertDocuments(documents: unknown[]): Promise<void> {
    const rawDocuments = documents.map((doc) => {
      const serializedDocument = this.serializer.serialize(doc);
      return ({
        value: serializedDocument,
        indexes: this.getIndexes(doc),
      });
    });

    await this.rawInsert(rawDocuments);
  }

  getIndexes(document: unknown): Indexes {
    const constructorName = document && typeof document === "object" &&
      (document as { $ctor?: unknown }).$ctor;
    if (typeof constructorName === "string") {
      return { $ctor: constructorName };
    }

    return {};
  }

  registerType<T extends object>(
    name: string,
    Type: { new (...args: any[]): T },
    serialize?: (instance: T) => object,
    parse?: (value: object) => T,
  ) {
    this.serializer.registerType(name, Type, serialize, parse);
  }

  queryHints: {
    [name: string]: {
      Type: { new (...args: any[]): any } | null;
      mapFn: (doc: any) => string | number | null;
    };
  } = {};
  registerQueryHint(
    name: string,
    Type: null,
    mapFn: (doc: unknown) => string | number | null,
  ): void;

  registerQueryHint<T>(
    name: string,
    Type: { new (...args: any[]): T },
    mapFn: (doc: T) => string | number | null,
  ): void;

  registerQueryHint(
    name: string,
    Type: { new (...args: any[]): any } | null,
    mapFn: (doc: any) => string | number | null,
  ) {
    // TODO: pre-load query hints & SHAs from the DB to avoid stepping on existing hints
    if (this.queryHints[name]) {
      throw new Error('A query hint with the same name is already registered')
    }
    this.queryHints[name] = { Type, mapFn };
  }

  // TODO: insertDocuments
  // TODO: registerQueryHints
  // TODO: registerType
  // TODO: redactDocuments

  protected async queryByFilter(
    filters: FilterOp[],
  ): Promise<unknown[]> {
    // const [bestFilter, ...otherFilters] = this.chooseBestFilter(filters)

    // TODO pass filter to rawQuery and only return matching filters

    return (await this.rawQuery({})).map((a) => this.serializer.parse(a.value));
  }

  protected chooseBestFilter(
    filters: FilterOp[],
  ) {
    // TODO: check for filters that are registered as query hints

    return filters;
  }

  protected abstract rawQuery(
    filter: { [key: string]: string | Range },
  ): Promise<RawDocument[]> | RawDocument[];
  protected abstract rawInsert(
    documents: {
      // no id, will be assigned
      // since ids are not allowed to collide & we don't want failures,
      // the user can't assign an id
      // note: the user can assign their own id
      value: unknown;
      indexes: Indexes;
    }[],
  ): Promise<string[]> | string[];
  protected abstract rawUpdateIndexValues(
    indexUpdates: { [id: string]: Indexes },
  ): Promise<void> | void;
  protected abstract rawEnsureIndex(
    indexFieldNames: string[],
  ): Promise<void> | void;
  protected abstract rawRedact(ids: string[]): Promise<void> | void;
}
