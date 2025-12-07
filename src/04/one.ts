import { Array, Effect, Equal, Number, Option, String, pipe } from 'effect'

import { getLines } from '../common.js'

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  return Array.reduce(lines, 0, (totalAccessibleRolls, line, lineIndex) => {
    const accessibleRollsOnLine = Array.reduce(
      Array.range(0, Number.decrement(String.length(line))),
      0,
      reduceAccessibleRollsOnLine(line, {
        maybePriorLine: Array.get(lines, Number.decrement(lineIndex)),
        maybeFollowingLine: Array.get(lines, Number.increment(lineIndex)),
      }),
    )

    return totalAccessibleRolls + accessibleRollsOnLine
  })
})

const reduceAccessibleRollsOnLine =
  (
    line: string,
    {
      maybePriorLine,
      maybeFollowingLine,
    }: {
      maybePriorLine: Option.Option<string>
      maybeFollowingLine: Option.Option<string>
    },
  ) =>
  (accessibleRollsOnLine: number, rollIndex: number): number => {
    const isRoll = pipe(
      line,
      String.at(rollIndex),
      Option.exists(Equal.equals('@')),
    )

    if (!isRoll) {
      return accessibleRollsOnLine
    }

    const isAccessible = isRollAccessible(line, rollIndex, {
      maybePriorLine,
      maybeFollowingLine,
    })

    if (isAccessible) {
      return Number.increment(accessibleRollsOnLine)
    }

    return accessibleRollsOnLine
  }

const MAX_NEIGHBORING_ROLLS = 3

const isRollAccessible = (
  line: string,
  rollIndex: number,
  {
    maybePriorLine,
    maybeFollowingLine,
  }: {
    maybePriorLine: Option.Option<string>
    maybeFollowingLine: Option.Option<string>
  },
) =>
  pipe(
    [
      safeStringAt(Number.decrement(rollIndex))(line),
      String.at(line, Number.increment(rollIndex)),
      Option.flatMap(maybePriorLine, safeStringAt(Number.decrement(rollIndex))),
      Option.flatMap(maybePriorLine, String.at(rollIndex)),
      Option.flatMap(maybePriorLine, String.at(Number.increment(rollIndex))),
      Option.flatMap(
        maybeFollowingLine,
        safeStringAt(Number.decrement(rollIndex)),
      ),
      Option.flatMap(maybeFollowingLine, String.at(rollIndex)),
      Option.flatMap(
        maybeFollowingLine,
        String.at(Number.increment(rollIndex)),
      ),
    ],
    Array.getSomes,
    Array.filter(Equal.equals('@')),
    Array.length,
    Number.lessThanOrEqualTo(MAX_NEIGHBORING_ROLLS),
  )

const safeStringAt =
  (index: number) =>
  (str: string): Option.Option<string> => {
    return pipe(
      index,
      Option.liftPredicate(Number.greaterThanOrEqualTo(0)),
      Option.flatMap((index) => String.at(str, index)),
    )
  }
