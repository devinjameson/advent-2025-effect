import { NodeFileSystem, NodeRuntime } from '@effect/platform-node/index'
import { FileSystem } from '@effect/platform/FileSystem'
import { Array, Console, Effect, flow, Match, pipe, String } from 'effect'

const getLines = FileSystem.pipe(
  Effect.flatMap((fs) => fs.readFileString('input.txt')),
  Effect.map(flow(String.split('\n'), Array.filter(String.isNonEmpty))),
)

const DIAL_SIZE = 100
const DIAL_START = 50

const partOne = Effect.gen(function* () {
  const lines = yield* getLines

  return pipe(
    lines,
    Array.reduce({ position: DIAL_START, totalZeroes: 0 }, (acc, line) => {
      const nextPosition =
        Match.value(line).pipe(
          Match.when(
            String.startsWith('R'),
            (str) => acc.position + restOfStringAsNumber(str),
          ),
          Match.when(
            String.startsWith('L'),
            (str) => acc.position - restOfStringAsNumber(str),
          ),
          Match.orElseAbsurd,
        ) % DIAL_SIZE

      const nextTotalZeroes =
        nextPosition === 0 ? acc.totalZeroes + 1 : acc.totalZeroes

      return {
        position: nextPosition,
        totalZeroes: nextTotalZeroes,
      }
    }),
    ({ totalZeroes }) => totalZeroes,
  )
})

const restOfStringAsNumber = (str: string): number =>
  parseInt(String.slice(1)(str))

partOne.pipe(
  Console.withTime('time'),
  Effect.tap(Console.log),
  Effect.catchAll(Console.log),
  Effect.provide(NodeFileSystem.layer),
  NodeRuntime.runMain,
)
