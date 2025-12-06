import { FileSystem } from '@effect/platform/FileSystem'
import { Array, Effect, String, flow } from 'effect'

export const getLines = (fileName: string) =>
  FileSystem.pipe(
    Effect.flatMap((fs) => fs.readFileString(fileName)),
    Effect.map(flow(String.split('\n'), Array.filter(String.isNonEmpty))),
  )

export const getFileString = (fileName: string) =>
  FileSystem.pipe(Effect.flatMap((fs) => fs.readFileString(fileName)))
