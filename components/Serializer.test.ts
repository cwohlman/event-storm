import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.75.0/testing/asserts.ts";
import { Serializer } from "./Serializer.ts";

Deno.test("Serializer - should round trip a prototype", () => {
  const serializer = new Serializer();
  class ExampleClass {}
  serializer.registerType("example", ExampleClass);

  const input = new ExampleClass();
  const serialized = serializer.serialize(input);
  const parsed = serializer.parse(serialized);

  // Three distinct objects
  assert(serialized !== input, "Serialized value should not equal input value");
  assert(
    serialized !== parsed,
    "Serialized value should not equal parsed value",
  );
  assert(input !== parsed, "Input value should not equal parsed value");

  // parsed is instanceof Example class
  assert(
    parsed instanceof ExampleClass,
    "Parsed value should be an instance of example class",
  );

  // Object.keys returns empty array for input & parsed
  assertEquals(
    Object.keys(input),
    [],
    "Serializer should not pollute prototype of example class",
  );
  assertEquals(
    Object.keys(parsed),
    [],
    "Serializer should not emit extraneous keys in parsed output",
  );
});

Deno.test("Serializer - serialized value should not be an instance of", () => {
  const serializer = new Serializer();
  class ExampleClass {}
  serializer.registerType("example", ExampleClass);
  const input = new ExampleClass();

  const output = serializer.serialize(input);

  assertEquals(output, { "$ctor": "example" });
  assert(!(output instanceof ExampleClass));
});

Deno.test("Serializer - should support array", () => {
  const serializer = new Serializer();
  class ExampleClass {}
  serializer.registerType("example", ExampleClass);
  const input = new ExampleClass();

  const parsed = serializer.parse(serializer.serialize([input]));

  assertEquals(parsed, [input]);
  assert(
    parsed[0] instanceof ExampleClass,
    "Parsed value should be an instance of example class",
  );
});

Deno.test("Serializer - plain object round trip", () => {
  const serializer = new Serializer();

  assertEquals(
    serializer.parse(serializer.serialize([{ foo: { bar: "baz" } }])),
    [{ foo: { bar: "baz" } }],
  );
});
