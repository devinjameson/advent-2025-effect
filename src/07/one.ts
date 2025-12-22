import {
  Array,
  Effect,
  Function,
  Graph,
  HashMap,
  Number,
  Option,
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
          (coordinates, char, xIndex) =>
            char === 'S' || char === '^'
              ? [...coordinates, { xIndex, yIndex, char }]
              : coordinates,
        ),
      )
      return [...coordinates, ...lineCoordinates]
    },
  )

  const nodeIndexByCoordinateRef = yield* Ref.make(
    HashMap.empty<Coordinate, number>(),
  )

  const graph = Graph.directed<Coordinate, Array<Coordinate>>((mutable) => {
    Array.forEach(coordinates, (sourceCoordinate) =>
      Array.forEach([Number.decrement, Number.increment], (f) =>
        addNodesAndEdges(
          sourceCoordinate,
          coordinates,
          mutable,
          nodeIndexByCoordinateRef,
          f,
        ).pipe(Effect.runSync),
      ),
    )
  })

  const bfs = Graph.bfs(graph, { start: [0] })

  const seen = Array.reduce<number, Array<number>>(
    Graph.indices(bfs),
    [],
    (seen, nodeIndex) =>
      Array.contains(seen, nodeIndex) ? seen : [...seen, nodeIndex],
  )

  return Number.decrement(Array.length(seen))
})

const addNodesAndEdges = (
  sourceCoordinate: Coordinate,
  coordinates: Array<Coordinate>,
  mutable: Graph.MutableDirectedGraph<Coordinate, Coordinate[]>,
  nodeIndexByCoordinateRef: Ref.Ref<HashMap.HashMap<Coordinate, number>>,
  f: (a: number) => number,
) =>
  Effect.gen(function* () {
    const xIndexToCheck =
      sourceCoordinate.char === 'S'
        ? sourceCoordinate.xIndex
        : f(sourceCoordinate.xIndex)

    return pipe(
      coordinates,
      Array.findFirst(
        (targetCoordinate) =>
          targetCoordinate.xIndex === xIndexToCheck &&
          targetCoordinate.yIndex > sourceCoordinate.yIndex,
      ),
      Option.match({
        onSome: (targetCoordinate) => {
          const sourceNodeIndex = getNodeIndexOrCreateNode(
            sourceCoordinate,
            mutable,
            nodeIndexByCoordinateRef,
          )

          const targetNodeIndex = getNodeIndexOrCreateNode(
            targetCoordinate,
            mutable,
            nodeIndexByCoordinateRef,
          )

          Graph.addEdge(mutable, sourceNodeIndex, targetNodeIndex, [
            sourceCoordinate,
            targetCoordinate,
          ])
        },
        onNone: Function.constVoid,
      }),
    )
  })

const getNodeIndexOrCreateNode = (
  coordinate: Coordinate,
  mutable: Graph.MutableDirectedGraph<Coordinate, Coordinate[]>,
  nodeIndexByCoordinateRef: Ref.Ref<HashMap.HashMap<Coordinate, number>>,
): number =>
  Effect.gen(function* () {
    const nodeIndexByCoordinate = yield* Ref.get(nodeIndexByCoordinateRef)

    return yield* HashMap.get(nodeIndexByCoordinate, coordinate).pipe(
      Option.match({
        onSome: Effect.succeed,
        onNone: () => {
          const nodeIndex = Graph.addNode(mutable, coordinate)
          return Ref.update(
            nodeIndexByCoordinateRef,
            HashMap.set(coordinate, nodeIndex),
          ).pipe(Effect.as(nodeIndex))
        },
      }),
    )
  }).pipe(Effect.runSync)
