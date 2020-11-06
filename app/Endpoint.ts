import { Handler } from './Handler.ts';

export class Endpoint {
  private handlers: Handler<any, any>[] = [];
  registerMessageHandler(
    handler: Handler<any, any>
  ) {
    this.handlers.push(handler);
  }

  async processRequest(message: unknown): Promise<unknown[]> {
    const results = await Promise.all(this.handlers.map(handler => handler.execute(message)));

    return results.filter(r => !!r);
  }
}
