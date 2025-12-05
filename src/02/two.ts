import { NodeFileSystem, NodeRuntime } from '@effect/platform-node/index'
import { Array, Console, Effect, Equal, pipe, String } from 'effect'

import { getFileString } from '../common'

export const two = (fileName: string) =>
  Effect.gen(function* () {
    const input = yield* getFileString(fileName)
    const ranges = pipe(input, String.split(','), Array.map(String.split('-')))
    const ints = pipe(
      ranges,
      Array.flatMap((range) =>
        Array.range(
          parseInt(Array.headNonEmpty(range)),
          parseInt(Array.lastNonEmpty(range)),
        ),
      ),
      Array.map((int) => int.toString()),
    )

    return Array.reduce(Array.take(ints, 200), 0, (total, int) =>
      isMatch(int) ? total + parseInt(int) : total,
    )
  })

const isMatch = (int: string) =>
  Array.reduce(
    Array.range(1, String.length(int) / 2),
    false,
    (isMatch, chunkSize) => {
      if (isMatch) {
        return isMatch
      }

      const chunks = pipe(
        int,
        String.split(''),
        Array.chunksOf(chunkSize),
        Array.map(Array.join('')),
      )

      return Array.every(chunks, Equal.equals(Array.headNonEmpty(chunks)))
    },
  )

two('input.txt').pipe(
  Console.withTime('time'),
  Effect.tap(Console.log),
  Effect.catchAll(Console.log),
  Effect.provide(NodeFileSystem.layer),
  NodeRuntime.runMain,
)
