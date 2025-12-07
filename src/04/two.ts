import {
  Array,
  Effect,
  Equal,
  HashSet,
  Number,
  Option,
  Ref,
  String,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  const totalRemovedRollsRef = yield* Ref.make(0)
  const gridRef = yield* Ref.make<Array<string>>(lines)

  while (true) {
    const grid = yield* Ref.get(gridRef)

    const { accessibleRollsOnGrid, nextGrid } = Array.reduce(
      grid,
      { accessibleRollsOnGrid: 0, nextGrid: grid },
      reduceAccessibleRollsAndNextGrid(grid),
    )

    if (accessibleRollsOnGrid === 0) {
      break
    }

    yield* Ref.getAndUpdate(
      totalRemovedRollsRef,
      Number.sum(accessibleRollsOnGrid),
    )

    yield* Ref.update(gridRef, () => nextGrid)
  }

  return yield* Ref.get(totalRemovedRollsRef)
})

const reduceAccessibleRollsAndNextGrid =
  (grid: string[]) =>
  (
    {
      accessibleRollsOnGrid,
      nextGrid,
    }: { accessibleRollsOnGrid: number; nextGrid: string[] },
    line: string,
    lineIndex: number,
  ) => {
    const positions = Array.reduce(
      Array.range(0, Number.decrement(String.length(line))),
      HashSet.empty(),
      reduceAccessibleRollsOnLine(line, {
        maybePriorLine: Array.get(grid, Number.decrement(lineIndex)),
        maybeFollowingLine: Array.get(grid, Number.increment(lineIndex)),
      }),
    )

    const nextAccessibleRollsOnGrid =
      accessibleRollsOnGrid + HashSet.size(positions)
    const nextNextGrid = Array.modify(nextGrid, lineIndex, nextLine(positions))

    return {
      accessibleRollsOnGrid: nextAccessibleRollsOnGrid,
      nextGrid: nextNextGrid,
    }
  }

const nextLine =
  (positions: HashSet.HashSet<number>) =>
  (line: string): string =>
    pipe(
      line,
      String.split(''),
      Array.map((char, index) => (HashSet.has(positions, index) ? 'x' : char)),
      Array.join(''),
    )

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
  (
    positions: HashSet.HashSet<number>,
    rollIndex: number,
  ): HashSet.HashSet<number> => {
    const isRoll = pipe(
      line,
      String.at(rollIndex),
      Option.exists(Equal.equals('@')),
    )

    if (!isRoll) {
      return positions
    }

    const isAccessible = isRollAccessible(line, rollIndex, {
      maybePriorLine,
      maybeFollowingLine,
    })

    if (isAccessible) {
      return HashSet.add(positions, rollIndex)
    }

    return positions
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
  (str: string): Option.Option<string> =>
    pipe(
      index,
      Option.liftPredicate(Number.greaterThanOrEqualTo(0)),
      Option.flatMap((index) => String.at(str, index)),
    )
