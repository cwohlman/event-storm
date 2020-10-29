import * as tests from '../tests.ts'
import {MemoryDatabase} from './MemoryDatabase.ts'

Deno.test('Memory DB - insert and query', tests.insertAndQuery(new MemoryDatabase([])))
Deno.test('Memory DB - sort', tests.sort(new MemoryDatabase([])))

// TODO: test that objects are immutable, changing the inserted object should not have any affect on future return values
//                                       changing the returned object should not have any affect on the inserted object or future return values
