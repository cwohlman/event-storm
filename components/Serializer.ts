export class Serializer {
  serialize(unknownDoc: unknown): any {
    if (! unknownDoc) {
      return unknownDoc
    }

    const doc = unknownDoc as any
    if (doc[this.serializeSymbol]) {
      return doc[this.serializeSymbol](
        this.serializeProperties(doc),
      );
    }

    if (typeof doc === 'object' && doc.constructor !== Object) {
      throw new Error(`Constructor ${doc.constructor.name} is not registered.`)
    }
    // TODO: exhaustive typeof check for security

    return doc
  }
  serializeProperties(doc: object): any {
    const keys = Object.keys(doc);
    const returnValue: any = {};

    keys.forEach((key) => {
      if (key === "$fn" || key === "$ctor") {
        throw new Error(`The ${key} key is reserved for serialization.`);
      }
      returnValue[key] = this.serialize((doc as any)[key]);
    });

    return returnValue;
  }
  parse(raw: unknown): any {
    // types that need serialization: functions, objects
    if (typeof raw === "object") {
      if (!raw) {
        return raw;
      }

      const docAsFn = raw as { $fn?: string };
      if (typeof docAsFn.$fn === "string") {
        return this.createFunction(docAsFn.$fn, docAsFn);
      }

      const docAsInstance = raw as { $ctor?: string };
      if (typeof docAsInstance.$ctor === "string") {
        return this.createInstance(docAsInstance.$ctor, docAsInstance);
      }

      return this.parseProperties(raw);
    }

    if (typeof raw === "function") {
    }

    return raw;
  }
  parseProperties(doc: object): any {
    const keys = Object.keys(doc).filter((key) =>
      key !== "$ctor" && key !== "$fn"
    );
    const returnValue: any = {};

    keys.forEach((key) => {
      returnValue[key] = this.parse((doc as any)[key]);
    });

    return returnValue;
  }

  private serializeSymbol = Symbol("serializer");
  private registeredTypes: {
    [name: string]: {
      Type: new (...args: any[]) => any;
      parse: (value: object) => any;
      serialize: (instance: any) => object;
    };
  } = {};
  registerType<T extends object>(
    name: string,
    Type: { new (...args: any[]): T },
    serialize: (instance: T) => object = (instance: T) => instance,
    parse: (value: object) => T = (value: object) => {
      return Object.assign(Object.create(Type.prototype), value)
    }
     ,
  ) {
    if (this.registeredTypes[name]) {
      throw new Error("Type is already registered!");
    }

    Type.prototype[this.serializeSymbol] = (value: any) => ({
      ...serialize(value),
      $ctor: name,
    });
    this.registeredTypes[name] = { Type, parse, serialize };
  }
  createInstance(name: string, value: object): any {
    const registeredType = this.registeredTypes[name];
    if (!registeredType) {
      throw new Error("Type is not registered!");
    }

    const parsedValue = this.parseProperties(value);

    return registeredType.parse(parsedValue);
  }

  private registeredFunctions: { [name: string]: Function } = {};
  registerFunction(name: string, value: Function) {
    if (this.registeredFunctions[name]) {
      throw new Error("Function is already registered!");
    }

    (value as any)[this.serializeSymbol] = () => ({ $fn: name });

    this.registeredFunctions[name] = value;
  }
  createFunction(name: string, value: object): Function {
    const registeredFunction = this.registeredFunctions[name];
    if (!registeredFunction) {
      throw new Error("Function is not registered");
    }

    return registeredFunction;
  }
}