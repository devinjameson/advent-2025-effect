import {
  Array,
  Config,
  Effect,
  Graph,
  HashSet,
  Number,
  Option,
  Order,
  String,
  Tuple,
  flow,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

type Position = { x: number; y: number; z: number }
type StraightLineDistance = number
type PositionAsString = string
type NodeIndex = number

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')
  const positions = Array.map(lines, lineToPosition)

  const nodeIndices = new Map<PositionAsString, NodeIndex>()

  const graph = Graph.undirected<Position, StraightLineDistance>((mutable) => {
    Array.forEach(positions, (aPosition, aPositionIndex) => {
      Array.forEach(positions, (bPosition, bPositionIndex) => {
        if (aPositionIndex === 0) {
          const nodeIndex = Graph.addNode(mutable, bPosition)
          nodeIndices.set(positionToString(bPosition), nodeIndex)
        }

        if (bPositionIndex > aPositionIndex) {
          const straightLineDistance = calculateStraightLineDistance(
            aPosition,
            bPosition,
          )
          const aNodeIndex = nodeIndices.get(positionToString(aPosition))!
          const bNodeIndex = nodeIndices.get(positionToString(bPosition))!

          Graph.addEdge(mutable, aNodeIndex, bNodeIndex, straightLineDistance)
        }
      })
    })
  })

  const shortestConnectionsCount = yield* Config.number(
    'SHORTEST_CONNECTIONS_COUNT',
  ).pipe(Config.withDefault(1000))

  const allEdgeIndices = pipe(graph, Graph.edges, Graph.indices)

  const shortestEdgesIndices: HashSet.HashSet<NodeIndex> = pipe(
    graph,
    Graph.edges,
    Graph.entries,
    Array.sort<[number, Graph.Edge<StraightLineDistance>]>(
      Order.mapInput(
        Order.number,
        flow(Tuple.getSecond, ({ data }) => data),
      ),
    ),
    Array.take(shortestConnectionsCount),
    Array.map(Tuple.getFirst),
    HashSet.fromIterable,
  )

  const graphWithOnlyShortestEdges = Graph.mutate(graph, (mutable) => {
    Array.forEach(allEdgeIndices, (edgeIndex) => {
      if (!HashSet.has(shortestEdgesIndices, edgeIndex)) {
        Graph.removeEdge(mutable, edgeIndex)
      }
    })
    Array.forEach(nodeIndices.values(), (nodeIndex) => {
      const neighbors = Graph.neighbors(mutable, nodeIndex)
      if (Array.isEmptyArray(neighbors)) {
        Graph.removeNode(mutable, nodeIndex)
      }
    })
  })

  const shortestEdgesNodeIndices = pipe(
    graphWithOnlyShortestEdges,
    Graph.nodes,
    Graph.indices,
    Array.dedupe,
  )

  const circuits = determineCircuits(
    shortestEdgesNodeIndices,
    graphWithOnlyShortestEdges,
    [],
    new Set(),
  )

  return pipe(
    circuits,
    Array.sort<Array<number>>(
      Order.mapInput(Order.reverse(Order.number), Array.length),
    ),
    Array.take(3),
    Array.map(Array.length),
    Number.multiplyAll,
  )
})

const determineCircuits = (
  shortestEdgesNodeIndices: Array<NodeIndex>,
  graphWithOnlyShortestEdges: Graph.Graph<Position, number, 'undirected'>,
  circuits: Array<Array<number>>,
  visitedNodes: Set<number>,
): Array<Array<number>> => {
  const univisitedNodeIndex = Array.findFirst(
    shortestEdgesNodeIndices,
    (nodeIndex) => !visitedNodes.has(nodeIndex),
  )

  if (Option.isNone(univisitedNodeIndex)) {
    return circuits
  }

  visitedNodes.add(univisitedNodeIndex.value)

  const circuit = [
    univisitedNodeIndex.value,
    ...determineRestOfCircuit(
      graphWithOnlyShortestEdges,
      visitedNodes,
      univisitedNodeIndex.value,
    ),
  ]

  return determineCircuits(
    shortestEdgesNodeIndices,
    graphWithOnlyShortestEdges,
    [...circuits, circuit],
    visitedNodes,
  )
}

const determineRestOfCircuit = (
  graphWithOnlyShortestEdges: Graph.Graph<Position, number, 'undirected'>,
  visitedNodes: Set<number>,
  startingNodeIndex: number,
): Array<number> => {
  const neighborIndices = Graph.neighbors(
    graphWithOnlyShortestEdges,
    startingNodeIndex,
  )

  return Array.flatMap(neighborIndices, (neighborIndex) => {
    if (visitedNodes.has(neighborIndex)) {
      return []
    }

    visitedNodes.add(neighborIndex)

    return [
      neighborIndex,
      ...determineRestOfCircuit(
        graphWithOnlyShortestEdges,
        visitedNodes,
        neighborIndex,
      ),
    ]
  })
}

const positionToString = ({ x, y, z }: Position) =>
  `${x.toString()},${y.toString()},${z.toString()}`

const lineToPosition = (line: string): Position =>
  pipe(
    line,
    String.split(','),
    Array.map(flow(Number.parse, Option.getOrThrow)),
    (arr) => ({
      x: Array.unsafeGet(arr, 0),
      y: Array.unsafeGet(arr, 1),
      z: Array.unsafeGet(arr, 2),
    }),
  )

const calculateStraightLineDistance = (
  aPosition: Position,
  bPosition: Position,
): number =>
  Math.sqrt(
    Number.sumAll([
      squared(bPosition.x - aPosition.x),
      squared(bPosition.y - aPosition.y),
      squared(bPosition.z - aPosition.z),
    ]),
  )

const squared = (x: number) => Math.pow(x, 2)
