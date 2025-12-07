#!/usr/bin/env tsx

import { Args, Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { Console, Effect, String } from 'effect'

const templateFiles = [
  'one.ts',
  'one.test.ts',
  'two.ts',
  'two.test.ts',
  'input.txt',
  'testInput.txt',
]

const createDayStructure = (day: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem
    const path = yield* Path

    const dayNum = String.padStart(2, '0')(day)
    const dayDir = path.join('src', dayNum)
    const templatesDir = path.join('scripts', 'templates')

    const exists = yield* fs.exists(dayDir)
    if (exists) {
      return yield* Effect.fail(
        `Directory ${dayDir} already exists! Use a different day number.`,
      )
    }

    yield* fs.makeDirectory(dayDir, { recursive: true })

    yield* Effect.forEach(templateFiles, (filename) =>
      Effect.gen(function* () {
        const templatePath = path.join(templatesDir, filename)
        const destinationPath = path.join(dayDir, filename)
        const content = yield* fs.readFileString(templatePath)
        yield* fs.writeFileString(destinationPath, content)
      }),
    )

    yield* Console.log(`Created ${dayDir}/ with all files`)
    yield* Console.log(`  - one.ts, one.test.ts`)
    yield* Console.log(`  - two.ts, two.test.ts`)
    yield* Console.log(`  - input.txt, testInput.txt`)
  })

const dayArg = Args.text({ name: 'day' }).pipe(
  Args.withDescription('The day number to scaffold (e.g., 4 or 04)'),
)

const command = Command.make('scaffold', { day: dayArg }, ({ day }) =>
  createDayStructure(day),
).pipe(
  Command.withDescription(
    'Scaffold a new day directory with template files for Advent of Code',
  ),
)

const cli = Command.run(command, {
  name: 'Advent of Code Scaffolder',
  version: '1.0.0',
})

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
