import { Array, Effect, String, pipe } from 'effect'

import { getFileString } from '../common.js'

export const solution = Effect.gen(function* () {
  const input = yield* getFileString('input.txt')
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

  return Array.reduce(ints, 0, (total, int) => {
    const hasOddDigits = String.length(int) % 2 !== 0
    if (hasOddDigits) {
      return total
    }

    const halfLength = String.length(int) / 2

    const firstHalf = String.slice(0, halfLength)(int)
    const secondHalf = String.slice(halfLength)(int)

    if (firstHalf === secondHalf) {
      return total + parseInt(int)
    }

    return total
  })
})
