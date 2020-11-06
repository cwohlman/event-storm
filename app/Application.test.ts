import { assert, assertEquals } from "https://deno.land/std@0.75.0/testing/asserts.ts"
import { Handler } from "./Handler.ts"

Deno.test('Handler - should execute every step in the pipeline', async () => {
  let didCallA = false;
  let didCallB = false;
  const handler = Handler.all.then(a => {didCallA = true; return { value: 5 }}).tap(Handler.map(() => didCallB = true))

  const result = await handler.execute('foo')

  assert(didCallA, 'A should have been called')
  assert(didCallB, 'B should have been called')
  assertEquals(result, { value: 5 })
})

Deno.test('Handler - should stop on null return value', async () => {
  let didCallA = false;
  let didCallB = false;
  class Burger {}
  const handler = Handler.byType(Burger).then(a => {didCallA = true; return { value: 5 }}).tap(Handler.map(() => didCallB = true))

  const result = await handler.execute('foo')

  assert(! didCallA, 'A should not have been called')
  assert(! didCallB, 'B should not have been called')
  assertEquals(result, null)
})