import { Array, Effect, Equal, String, pipe } from 'effect'

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

  return pipe(
    ints,
    Array.filter((int) => String.length(int) > 1),
    Array.reduce(0, (total, int) =>
      isMatch(int) ? total + parseInt(int) : total,
    ),
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
