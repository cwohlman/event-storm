import { MongoClient, Database, Collection } from "https://deno.land/x/mongo@v0.13.0/mod.ts";

import { AbstractDatabase, Indexes, RawDocument } from '../types.ts'

export class MongoDatabase extends AbstractDatabase {
  public readonly _client: MongoClient;
  public readonly _db: Database;
  public readonly _collection: Collection<RawDocument>;
  constructor(
    public readonly connectionString: string,
    public readonly dbName: string,
    public readonly collectionName: string
  ) {
    super()

    this._client = new MongoClient();
    this._client.connectWithUri(connectionString);
    this._db = this._client.database(dbName);
    this._collection = this._db.collection<RawDocument>(collectionName);

    // Not implemented:
    // this._collection.createIndexes([{ keys: { "indexes.$ctor": 1 }}])
  }
  
  protected async rawQuery(filter: { [key: string]: string | { gt: string | number; } | { lt: string | number; } | { gt: string | number; lt: string | number; }; }): Promise<RawDocument[]> {
    const result = await this._collection.find({});

    return result
  }
  protected async rawInsert(documents: { value: unknown; indexes: { [key: string]: string; }; }[]): Promise<string[]> {
    const result = await this._collection.insertMany(documents)

    return result.map(r => r.$oid)
  }
  protected rawUpdateIndexValues(indexUpdates: { [id: string]: Indexes; }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected rawEnsureIndex(indexFieldNames: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected rawRedact(ids: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

}
