import { NodeFileSystem, NodePath, NodeRuntime } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { Array, Console, Effect, Equal, Option } from 'effect'

const program = Effect.gen(function* () {
  const args = Array.drop(process.argv, 2)

  const [day, part] = yield* Option.product(
    Array.head(args),
    Array.get(args, 1),
  ).pipe(Effect.mapError(() => 'MissingArguments' as const))

  const fileUrl = new URL(import.meta.url)

  const path = yield* Path
  const srcDir = yield* path.fromFileUrl(fileUrl)
  const dayDir = path.join(path.dirname(srcDir), day)
  yield* Effect.sync(() => process.chdir(dayDir))

  const { solution } = yield* Effect.promise<{
    solution: Effect.Effect<number, string, FileSystem>
  }>(() => import(`./${day}/${part}.js`))

  return yield* solution
}).pipe(
  Effect.catchIf(Equal.equals('MissingArguments'), () =>
    Effect.gen(function* () {
      yield* Console.error('Usage: tsx run.ts <day> <part>')
      yield* Console.error('Example: tsx run.ts 01 one')
    }),
  ),
)

program.pipe(
  Console.withTime('time'),
  Effect.tap(Console.log),
  Effect.provide(NodePath.layer),
  Effect.provide(NodeFileSystem.layer),
  NodeRuntime.runMain,
)
