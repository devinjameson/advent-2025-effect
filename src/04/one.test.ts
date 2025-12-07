import { expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { TestFileSystem } from '../testFileSystem.js'
import { solution } from './one.js'

it.effect('gives the right solution', () =>
  Effect.gen(function* () {
    const result = yield* solution
    expect(result).toBe(13)
  }).pipe(Effect.provide(TestFileSystem(import.meta.url))),
)
