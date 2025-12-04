import { expect, it } from '@effect/vitest'
import { NodeFileSystem } from '@effect/platform-node/index'
import { Effect } from 'effect'

import { one } from './one'

it.effect('gives the right solution', () =>
  Effect.gen(function* () {
    const result = yield* one('./oneTestInput.txt')
    expect(result).toBe(1227775554)
  }).pipe(Effect.provide(NodeFileSystem.layer)),
)
