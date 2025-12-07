import {
  Array,
  Effect,
  Number,
  Option,
  Order,
  String,
  flow,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

const ON_BATTERIES = 12

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  return yield* Effect.reduce(lines, 0, (total, line) =>
    Effect.gen(function* () {
      const lineAsDigits = pipe(
        line,
        String.split(''),
        Array.map(flow(Number.parse, Option.getOrThrow)),
      )

      const joltage = yield* Effect.reduce(
        Array.range(1, ON_BATTERIES),
        { joltage: '', startingIndex: 0 },
        joltageReducer(lineAsDigits),
      ).pipe(Effect.flatMap(({ joltage }) => Number.parse(joltage)))

      return total + joltage
    }),
  )
})

const joltageReducer =
  (lineAsDigits: Array.NonEmptyReadonlyArray<number>) =>
  (
    { joltage, startingIndex }: { joltage: string; startingIndex: number },
    joltageDigit: number,
  ) =>
    Effect.gen(function* () {
      const availableDigits = yield* pipe(
        lineAsDigits,
        Array.drop(startingIndex),
        Array.dropRight(ON_BATTERIES - joltageDigit),
        Option.liftPredicate(Array.isNonEmptyArray),
      )

      const nextDigit = Array.max(availableDigits, Order.number)

      const nextStartingIndex = yield* Array.findFirstIndex(
        lineAsDigits,
        (digit, index) => digit === nextDigit && index >= startingIndex,
      ).pipe(Option.map(Number.increment))

      const nextJoltage = `${joltage}${nextDigit}`

      return {
        joltage: nextJoltage,
        startingIndex: nextStartingIndex,
      }
    })
