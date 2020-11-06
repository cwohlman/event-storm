import { DataTypes, Database, Model } from 'https://raw.githubusercontent.com/cwohlman/denodb/master/mod.ts'
import { AbstractDatabase, Indexes, RawDocument } from '../types.ts'

export class DefaultModel extends Model {
  public id?: number = 0
  public value: any
  public ctor?: string = ""

  static fields = {
    id: { primaryKey: true, autoIncrement: true },
    value: DataTypes.JSON,
    ctor: DataTypes.STRING
  }

  static defaults = {
    ctor: ''
  }
}

export class DenoDbDatabase extends AbstractDatabase {
  table: typeof DefaultModel

  constructor(
    public readonly _db: Database,
    public readonly collectionName: string
  ) {
    super()

    this.table = class TableModel extends DefaultModel {
      static table = collectionName
    }

    _db.link([this.table as any])
  }

  protected initDb() {
    return this._db.sync()
  }

  resetDb() {
    return this._db.sync({ drop: true })
  }

  close() {
    return this._db.close()
  }
  
  protected async rawQuery(filter: { [key: string]: string | { gt: string | number; } | { lt: string | number; } | { gt: string | number; lt: string | number; }; }): Promise<RawDocument[]> {
    const values = (await this.table.get()) as DefaultModel[]

    return values.map(value => ({
      id: value.id + '',
      value: value.value,
    }))
  }
  protected async rawInsert(documents: { value: unknown; indexes: { [key: string]: string; }; }[]): Promise<string[]> {
    return await this.table.create(documents.map(doc => ({
      value: JSON.stringify(doc.value),
      ...doc.indexes
    })))
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
