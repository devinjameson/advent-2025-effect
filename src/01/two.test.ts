import { expect, it } from '@effect/vitest'
import { Effect } from 'effect'
import { two } from './two'
import { NodeFileSystem } from '@effect/platform-node/index'

it.effect('gives the right solution', () =>
  Effect.gen(function* () {
    const result = yield* two('twoTestInput.txt')
    expect(result).toBe(6)
  }).pipe(Effect.provide(NodeFileSystem.layer)),
)
