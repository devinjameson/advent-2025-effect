import { expect, it } from '@effect/vitest'
import { NodeFileSystem } from '@effect/platform-node/index'
import { Effect } from 'effect'

import { two } from './two'

it.effect('gives the right solution', () =>
  Effect.gen(function* () {
    const result = yield* two('./testInput.txt')
    expect(result).toBe(4174379265)
  }).pipe(Effect.provide(NodeFileSystem.layer)),
)
