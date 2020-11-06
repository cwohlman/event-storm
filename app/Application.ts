import { Application as OakApplication } from "https://deno.land/x/oak/mod.ts";
import { Serializer } from "../components/Serializer.ts";


export interface StandardHandler<T> {
}

export type WithoutNull<T> = T extends null & infer P ? P : T

export class Handler<T, TOutput> {
  private constructor(
    private fns: Function[],
  ) {}

  async execute(input: T): Promise<TOutput | null> {
    let output = input;

    for (let i = 0; i < this.fns.length; i++) {
      const nextAction = this.fns[i];

      output = await nextAction(output);

      if (output === null) {
        return output as any
      }
    }

    return output as any;
  }

  chain<TThen>(
    handler: Handler<TOutput, TThen>
  ): Handler<T, WithoutNull<TThen>> {
    return new Handler(this.fns.concat(handler.fns))
  }


  then<TThen>(
    fn: (input: TOutput) => TThen | Promise<TThen>,
    errorHandler: (error: Error, handlerStack: Error) => TThen | null = this.handleErrors
  ): Handler<T, WithoutNull<TThen>> {
    const handlerStack = new Error('This handler threw an error')

    // TODO: if we bind the function below to the runtime Handler (not the current one)
    //       then we can use this.errorHandler to ensure the last handler in the list can set the error handler, maybe
    return new Handler(this.fns.concat(async (input: TOutput) => {
      try {
        return fn(input);
      } catch (error) {
        return errorHandler(error, handlerStack)
      }
    }));
  }

  filter<TType extends TOutput>(
    fn: (input: TOutput) => input is TType,
    sink: (input: TOutput) => void,
    errorHandler?: (error: Error, handlerStack: Error) => null
  ): Handler<T, TType>

  filter(
    fn: (input: TOutput) => boolean | Promise<boolean>,
    sink: (input: TOutput) => void = () => {},
    errorHandler: (error: Error, handlerStack: Error) => null = this.handleErrors
  ) {
    const handlerStack = new Error('This handler threw an error')

    return new Handler(this.fns.concat(async (output: TOutput) => {
      let conditionResult: boolean

      try {
        conditionResult = await fn(output)
      } catch (error) {
        return errorHandler(error, handlerStack)
      }

      if (! conditionResult) {
        try {
          sink(output)
        } catch (error) {
          return errorHandler(error, handlerStack)
        }
      }

      return output;
    }));
  }

  tap<TForkResult>(
    handler: Handler<TOutput, TForkResult>,
    sink: (input: TForkResult | Error | null) => void = () => {},
    errorHandler: (error: Error, handlerStack: Error) => null = this.handleErrors
  ): Handler<T, TOutput> {
    const handlerStack = new Error('This handler threw an error')

    return new Handler(this.fns.concat(async (output: TOutput) => {
      let sideResult: TForkResult | null;
      
      // TODO: should this happen in parallel?
      try {
        sideResult = await handler.execute(output)
      } catch (error) {
        sideResult = error
      }


      try {
        sink(sideResult);
      } catch (error) {
        errorHandler(error, handlerStack)
      }

      return output;
    }));
  }

  // Tries both branches, returns the non-null branch
  fork<TForkResult>(
    left: Handler<TOutput, TForkResult>,
    right: Handler<TOutput, TForkResult>
  ) {
    return new Handler(this.fns.concat(async (output: TOutput) => {
      const leftResult = await left.execute(output)
      if (leftResult !== null) {
        return leftResult
      }

      return await right.execute(output)
    }))
  }

  // Chooses one branch or another based on the condition
  partition<TForkResult>(
    condition: Handler<TOutput, boolean>,
    ifBranch: Handler<TOutput, TForkResult>,
    elseBranch: Handler<TOutput, TForkResult>
  ) {
    return new Handler(this.fns.concat(async (output: TOutput) => {
      const conditionOutput = await condition.execute(output)

      if (conditionOutput) {
        return ifBranch.execute(output)
      }

      return elseBranch.execute(output)
    }))
  }
  
  private handleErrors = (error: Error, handlerStack: Error) => { Handler.globalErrorHandler(error, handlerStack); return null; };

  static globalErrorHandler: (error: Error, handlerStack: Error) => void = (error) => {
    console.error(error);
  };

  static all = new Handler<unknown, unknown>([])

  static map<T, O>(fn: (input: T) => O | Promise<O>): Handler<T, O> {
    return new Handler([fn])
  }

  static byType<T>(type: { new(...args: any[]): T }): Handler<unknown, T> {
    return Handler.all.then<T | null>(t => t instanceof type ? t : null) as any
  }
}
export class Endpoint {
  private handlers: Handler<any, any>[] = []
  registerMessageHandler(
    handler: Handler<any, any>
  ) {
    this.handlers.push(handler)
  }

  async processRequest(message: unknown): Promise<unknown[]> {
    const results = await Promise.all(this.handlers.map(handler => handler.execute(message)))

    return results.filter(r => !! r)
  }
}

export class Application extends OakApplication {
  registerEndpoint(pathname: string, endpoint: Endpoint, serializer: Serializer = new Serializer()) {
    this.use(async (ctx, next) => {
      if (ctx.request.method === 'POST' && ctx.request.url.pathname === pathname && ctx.request.headers.get('content-type') === 'application/json') {


        try {
          const requestBody = ctx.request.body({ type: "json" })
          const request = serializer.parse(await requestBody.value)
          const response = await endpoint.processRequest(request)

          ctx.response.body = JSON.stringify(serializer.serialize(response))
        } catch (error) {
          console.error(error)
        }

      } else {
        next()
      }
    })
  }
}