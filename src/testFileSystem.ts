import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { Effect, Layer } from 'effect'

/**
 * Creates a test FileSystem layer that redirects reads of 'input.txt' to 'testInput.txt'
 * in the specified directory.
 */
export const TestFileSystem = (importMetaUrl: string) =>
  Layer.unwrapEffect(
    Effect.gen(function* () {
      const path = yield* Path

      const filePath = yield* path.fromFileUrl(new URL(importMetaUrl))
      const testDir = path.dirname(filePath)
      const testInputPath = path.join(testDir, 'testInput.txt')

      return Layer.effect(
        FileSystem,
        Effect.gen(function* () {
          const fs = yield* FileSystem
          return {
            ...fs,
            readFileString: (filePath: string) =>
              filePath === 'input.txt'
                ? fs.readFileString(testInputPath)
                : fs.readFileString(filePath),
          }
        }),
      )
    }),
  ).pipe(Layer.provide(NodePath.layer), Layer.provide(NodeFileSystem.layer))
