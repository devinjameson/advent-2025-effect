import { expect, it } from '@effect/vitest'
import { ConfigProvider, Effect, Layer } from 'effect'

import { TestFileSystem } from '../testFileSystem.js'
import { solution } from './one.js'

it.effect('gives the right solution', () =>
  Effect.gen(function* () {
    const result = yield* solution
    expect(result).toBe(40)
  }).pipe(
    Effect.provide(TestFileSystem(import.meta.url)),
    Effect.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([['SHORTEST_CONNECTIONS_COUNT', '10']]),
        ),
      ),
    ),
  ),
)
