import {
  Array,
  Effect,
  Match,
  Number,
  Option,
  Order,
  String,
  Struct,
  Tuple,
  flow,
} from 'effect'

import { getLines } from '../common.js'

type Range = [start: number, end: number]

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  const { freshIdRanges, availableIds } = Array.reduce<
    string,
    { freshIdRanges: Array<Range>; availableIds: Array<number> }
  >(lines, { freshIdRanges: [], availableIds: [] }, (acc, line) =>
    Match.value(line).pipe(
      Match.when(String.includes('-'), (dashedFreshIdRange) =>
        Struct.evolve(acc, {
          freshIdRanges: (freshIdRanges) =>
            Array.append(
              freshIdRanges,
              dashedStringToRange(dashedFreshIdRange),
            ),
        }),
      ),
      Match.when(String.isNonEmpty, (id) =>
        Struct.evolve(acc, {
          availableIds: (availableIds) =>
            Array.append(
              availableIds,
              Number.parse(id).pipe(Option.getOrThrow),
            ),
        }),
      ),
      Match.orElse(() => acc),
    ),
  )

  return Array.reduce(
    availableIds,
    0,
    reduceFreshAvailableIdsCount(freshIdRanges),
  )
})

const reduceFreshAvailableIdsCount =
  (freshIdRanges: Array<Range>) =>
  (freshAvailableIdsCount: number, availableId: number) =>
    Array.some(freshIdRanges, ([freshIdStart, freshIdEnd]) =>
      Order.between(Order.number)({
        minimum: freshIdStart,
        maximum: freshIdEnd,
      })(availableId),
    )
      ? Number.increment(freshAvailableIdsCount)
      : freshAvailableIdsCount

const dashedStringToRange = flow(
  String.split('-'),
  (range) => Tuple.make(Array.headNonEmpty(range), Array.lastNonEmpty(range)),
  Tuple.map(flow(Number.parse, Option.getOrThrow)),
)
