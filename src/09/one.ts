import { Array, Effect, Number, Option, String, flow } from 'effect'

import { getLines } from '../common.js'

type Coordinate = { xIndex: number; yIndex: number }

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  const coordinates: Array<Coordinate> = Array.map(
    lines,
    flow(
      String.split(','),
      Array.map(flow(Number.parse, Option.getOrThrow)),
      (arr) => ({
        xIndex: Array.unsafeGet(arr, 0),
        yIndex: Array.unsafeGet(arr, 1),
      }),
    ),
  )

  let biggestArea: number = 0

  Array.forEach(coordinates, (coordinateA, coordinateAIndex) => {
    Array.forEach(coordinates, (coordinateB, coordinateBIndex) => {
      if (coordinateBIndex > coordinateAIndex) {
        const area = calculateArea(coordinateA, coordinateB)
        if (area > biggestArea) {
          biggestArea = area
        }
      }
    })
  })

  return biggestArea
})

const calculateArea = (
  coordinateA: Coordinate,
  coordinateB: Coordinate,
): number =>
  Number.increment(Math.abs(coordinateA.xIndex - coordinateB.xIndex)) *
  Number.increment(Math.abs(coordinateA.yIndex - coordinateB.yIndex))
