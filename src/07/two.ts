import {
  Array,
  Effect,
  Function,
  Graph,
  HashMap,
  Number,
  Option,
  Predicate,
  Ref,
  String,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

type Coordinate = { xIndex: number; yIndex: number; char: string }

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')
  const coordinates = Array.reduce<string, Array<Coordinate>>(
    lines,
    [],
    (coordinates, line, yIndex) => {
      const lineCoordinates = pipe(
        line,
        String.split(''),
        Array.reduce<Array<Coordinate>, string>(
          [],
          (lineCoordinates, char, xIndex) =>
            char === 'S' || char === '^'
              ? [...lineCoordinates, { xIndex, yIndex, char }]
              : lineCoordinates,
        ),
      )
      return [...coordinates, ...lineCoordinates]
    },
  )

  const coordinateToNodeIndexRef = yield* Ref.make(
    HashMap.empty<Coordinate, number>(),
  )

  const graph = Graph.directed<Coordinate, Array<Coordinate>>((mutable) => {
    Array.forEach(coordinates, (sourceCoordinate) => {
      const toTargetXs =
        sourceCoordinate.char === 'S'
          ? [Function.identity]
          : [Number.decrement, Number.increment]

      return Array.forEach(toTargetXs, (toTargetX) =>
        addEdgeToNextSplitter(
          sourceCoordinate,
          coordinates,
          mutable,
          coordinateToNodeIndexRef,
          toTargetX,
        ),
      )
    })
  })

  const cache = new Map<number, number>()

  return countPaths(graph, 0, cache)
})

const countPaths = (
  graph: Graph.DirectedGraph<Coordinate, Coordinate[]>,
  nodeIndex: number,
  cache: Map<number, number>,
): number => {
  const cached = cache.get(nodeIndex)

  if (Predicate.isNotUndefined(cached)) {
    return cached
  } else {
    const outgoingNeighbors = Graph.neighbors(graph, nodeIndex)
    const beamCount = nodeIndex === 0 ? 1 : 2
    const exitingBeams = beamCount - Array.length(outgoingNeighbors)

    const pathsCount =
      exitingBeams +
      Array.reduce(
        outgoingNeighbors,
        0,
        (acc, neighbor) => acc + countPaths(graph, neighbor, cache),
      )

    cache.set(nodeIndex, pathsCount)

    return pathsCount
  }
}

const addEdgeToNextSplitter = (
  sourceCoordinate: Coordinate,
  coordinates: Array<Coordinate>,
  mutable: Graph.MutableDirectedGraph<Coordinate, Coordinate[]>,
  coordinateToNodeIndexRef: Ref.Ref<HashMap.HashMap<Coordinate, number>>,
  toTargetX: (a: number) => number,
) =>
  pipe(
    coordinates,
    Array.findFirst(
      (targetCoordinate) =>
        targetCoordinate.xIndex === toTargetX(sourceCoordinate.xIndex) &&
        targetCoordinate.yIndex > sourceCoordinate.yIndex,
    ),
    Option.match({
      onSome: (targetCoordinate) => {
        const sourceNodeIndex = getNodeIndexOrCreateNode(
          sourceCoordinate,
          mutable,
          coordinateToNodeIndexRef,
        )

        const targetNodeIndex = getNodeIndexOrCreateNode(
          targetCoordinate,
          mutable,
          coordinateToNodeIndexRef,
        )

        Graph.addEdge(mutable, sourceNodeIndex, targetNodeIndex, [
          sourceCoordinate,
          targetCoordinate,
        ])
      },
      onNone: Function.constVoid,
    }),
  )

const getNodeIndexOrCreateNode = (
  coordinate: Coordinate,
  mutable: Graph.MutableDirectedGraph<Coordinate, Coordinate[]>,
  coordinateToNodeIndexRef: Ref.Ref<HashMap.HashMap<Coordinate, number>>,
): number =>
  Effect.gen(function* () {
    const coordinateToNodeIndex = yield* Ref.get(coordinateToNodeIndexRef)

    return yield* HashMap.get(coordinateToNodeIndex, coordinate).pipe(
      Option.match({
        onSome: Effect.succeed,
        onNone: () => {
          const nodeIndex = Graph.addNode(mutable, coordinate)
          return Ref.update(
            coordinateToNodeIndexRef,
            HashMap.set(coordinate, nodeIndex),
          ).pipe(Effect.as(nodeIndex))
        },
      }),
    )
  }).pipe(Effect.runSync)
