import { NodeFileSystem, NodeRuntime } from '@effect/platform-node/index'
import {
  Array,
  Console,
  Effect,
  flow,
  Match,
  Number,
  pipe,
  String,
} from 'effect'

import { getLines } from '../common'

const DIAL_SIZE = 100
const DIAL_START = 50

export const two = (fileName: string) =>
  Effect.gen(function* () {
    const lines = yield* getLines(fileName)

    return pipe(
      lines,
      Array.reduce(
        { position: DIAL_START, zeroStops: 0, zeroPasses: 0 },
        (acc, line) => {
          const move = Match.value(line).pipe(
            Match.when(String.startsWith('R'), restOfStringAsNumber),
            Match.when(
              String.startsWith('L'),
              flow(restOfStringAsNumber, Number.negate),
            ),
            Match.orElseAbsurd,
          )

          const nextPosition = pipe(
            move,
            Number.sum(acc.position),
            Number.remainder(DIAL_SIZE),
            (value) => (value < 0 ? DIAL_SIZE + value : value),
          )

          const zeroStopsToAdd = nextPosition === 0 ? 1 : 0
          const nextZeroStops = acc.zeroStops + zeroStopsToAdd

          const zeroPassesThisRotation = Match.value(line).pipe(
            Match.when(
              String.startsWith('R'),
              () => (acc.position + move) / DIAL_SIZE,
            ),
            Match.when(
              String.startsWith('L'),
              () =>
                (DIAL_SIZE - (acc.position + move)) / DIAL_SIZE -
                (acc.position === 0 ? 1 : 0),
            ),
            Match.orElseAbsurd,
            Math.floor,
          )

          const zeroPassesToAdd = zeroPassesThisRotation - zeroStopsToAdd

          const nextZeroPasses = acc.zeroPasses + zeroPassesToAdd

          return {
            position: nextPosition,
            zeroStops: nextZeroStops,
            zeroPasses: nextZeroPasses,
          }
        },
      ),
      ({ zeroStops, zeroPasses }) => zeroStops + zeroPasses,
    )
  })

const restOfStringAsNumber = (str: string): number =>
  parseInt(String.slice(1)(str))

two('input.txt').pipe(
  Console.withTime('time'),
  Effect.tap(Console.log),
  Effect.catchAll(Console.log),
  Effect.provide(NodeFileSystem.layer),
  NodeRuntime.runMain,
)
