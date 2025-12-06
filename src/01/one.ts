import { Array, Effect, Match, Number, String, pipe } from 'effect'

import { getLines } from '../common.js'

const DIAL_SIZE = 100
const DIAL_START = 50

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  return pipe(
    lines,
    Array.reduce({ position: DIAL_START, zeroStops: 0 }, (acc, line) => {
      const nextPosition = Match.value(line).pipe(
        Match.when(
          String.startsWith('R'),
          (str) => acc.position + restOfStringAsNumber(str),
        ),
        Match.when(
          String.startsWith('L'),
          (str) => acc.position - restOfStringAsNumber(str),
        ),
        Match.orElseAbsurd,
        Number.remainder(DIAL_SIZE),
        (value) => (value < 0 ? DIAL_SIZE + value : value),
      )

      const nextZeroStops =
        nextPosition === 0 ? acc.zeroStops + 1 : acc.zeroStops

      return {
        position: nextPosition,
        zeroStops: nextZeroStops,
      }
    }),
    ({ zeroStops }) => zeroStops,
  )
})

const restOfStringAsNumber = (str: string): number =>
  parseInt(String.slice(1)(str))
