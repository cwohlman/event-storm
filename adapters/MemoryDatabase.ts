import { AbstractDatabase, Indexes, RawDocument } from '../types.ts'

export class MemoryDatabase extends AbstractDatabase {
  constructor(
    private data: { value: unknown, id: string }[]
  ) {
    super()
  }
  
  protected rawQuery(filter: { [key: string]: string | { gt: string | number; } | { lt: string | number; } | { gt: string | number; lt: string | number; }; }): RawDocument[] | Promise<RawDocument[]> {
    return this.data.concat([]) 
  }
  protected rawInsert(documents: { value: unknown; indexes: { [key: string]: string; }; }[]): string[] | Promise<string[]> {
    return documents.map(doc => {
      const id = this.data.length + ''

      this.data.push({ ...doc, id })

      return id
    })
  }
  protected rawUpdateIndexValues(indexUpdates: { [id: string]: Indexes; }): void | Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected rawEnsureIndex(indexFieldNames: string[]): void | Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected rawRedact(ids: string[]): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

}
