import { NodeFileSystem, NodeRuntime } from '@effect/platform-node/index'
import { Array, Console, Effect, pipe, String } from 'effect'

import { getFileString } from '../common'

export const one = (fileName: string) =>
  Effect.gen(function* () {
    const input = yield* getFileString(fileName)
    const ranges = pipe(input, String.split(','), Array.map(String.split('-')))
    const numbers = pipe(
      ranges,
      Array.flatMap((range) =>
        Array.range(
          parseInt(Array.headNonEmpty(range)),
          parseInt(Array.lastNonEmpty(range)),
        ),
      ),
      Array.map((number) => number.toString()),
    )

    return Array.reduce(numbers, 0, (total, number) => {
      const hasOddDigits = String.length(number) % 2 !== 0
      if (hasOddDigits) {
        return total
      }

      const halfLength = String.length(number) / 2

      const firstHalf = String.slice(0, halfLength)(number)
      const secondHalf = String.slice(halfLength)(number)

      if (firstHalf === secondHalf) {
        return total + parseInt(number)
      }

      return total
    })
  })

one('input.txt').pipe(
  Console.withTime('time'),
  Effect.tap(Console.log),
  Effect.catchAll(Console.log),
  Effect.provide(NodeFileSystem.layer),
  NodeRuntime.runMain,
)
