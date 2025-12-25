import {
  Array,
  Config,
  Effect,
  Graph,
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

  const shortestEdgesIndices: Array<NodeIndex> = pipe(
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
  )

  const graphWithOnlyShortestEdges = Graph.mutate(graph, (mutable) => {
    Array.forEach(allEdgeIndices, (edgeIndex) => {
      if (!Array.contains(shortestEdgesIndices, edgeIndex)) {
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
    [],
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
  visitedNodes: Array<number>,
): Array<Array<number>> => {
  const startingNodeIndex = Array.findFirst(
    shortestEdgesNodeIndices,
    (nodeIndex) => !Array.contains(visitedNodes, nodeIndex),
  )

  if (Option.isNone(startingNodeIndex)) {
    return circuits
  }

  visitedNodes.push(startingNodeIndex.value)

  const circuit = [
    startingNodeIndex.value,
    ...determineRestOfCircuit(
      graphWithOnlyShortestEdges,
      visitedNodes,
      startingNodeIndex.value,
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
  visitedNodes: Array<number>,
  startingNodeIndex: number,
): Array<number> => {
  const neighborIndices = Graph.neighbors(
    graphWithOnlyShortestEdges,
    startingNodeIndex,
  )

  return Array.flatMap(neighborIndices, (neighborIndex) => {
    if (Array.contains(visitedNodes, neighborIndex)) {
      return []
    }

    visitedNodes.push(neighborIndex)

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
