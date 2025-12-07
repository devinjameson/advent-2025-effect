import { FileSystem } from '@effect/platform/FileSystem'
import { Array, Effect, String, flow } from 'effect'

export const getLines = (filename: string) =>
  FileSystem.pipe(
    Effect.flatMap((fs) => fs.readFileString(filename)),
    Effect.map(flow(String.split('\n'), Array.filter(String.isNonEmpty))),
  )

export const getFileString = (filename: string) =>
  FileSystem.pipe(Effect.flatMap((fs) => fs.readFileString(filename)))
