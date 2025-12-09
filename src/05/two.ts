import {
  Array,
  Effect,
  Match,
  Number,
  Option,
  Order,
  String,
  Tuple,
  flow,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

const dashedStringToRange = flow(
  String.split('-'),
  (range) => Tuple.make(Array.headNonEmpty(range), Array.lastNonEmpty(range)),
  Tuple.map(flow(Number.parse, Option.getOrThrow)),
)

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  const sortedFreshIdRanges = pipe(
    lines,
    Array.takeWhile(String.includes('-')),
    Array.map(dashedStringToRange),
    Array.sort(Order.tuple(Order.number, Order.number)),
  )

  const { freshIdsCount } = Array.reduce(
    sortedFreshIdRanges,
    { freshIdsCount: 0, maybeMaxSeenEnd: Option.none() },
    reduceFreshIdsCount,
  )

  return freshIdsCount
})

const reduceFreshIdsCount = (
  {
    freshIdsCount,
    maybeMaxSeenEnd,
  }: { freshIdsCount: number; maybeMaxSeenEnd: Option.Option<number> },
  [start, end]: [start: number, end: number],
) => {
  if (Option.isNone(maybeMaxSeenEnd)) {
    const nextFreshIdsCount = freshIdsCount + Number.increment(end - start)

    return {
      freshIdsCount: nextFreshIdsCount,
      maybeMaxSeenEnd: Option.some(end),
    }
  }

  const { value: maxSeenEnd } = maybeMaxSeenEnd

  const nextFreshIdsCount =
    freshIdsCount +
    Match.value(maxSeenEnd).pipe(
      Match.when(Number.greaterThanOrEqualTo(end), () => 0),
      Match.when(Number.lessThan(start), () => Number.increment(end - start)),
      Match.orElse(() => end - maxSeenEnd),
    )

  return {
    freshIdsCount: nextFreshIdsCount,
    maybeMaxSeenEnd: Option.some(Number.max(end, maxSeenEnd)),
  }
}
