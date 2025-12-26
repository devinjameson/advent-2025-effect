import {
  Array,
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

  const sortedEdges = pipe(
    graph,
    Graph.edges,
    Graph.entries,
    Array.sort<[number, Graph.Edge<StraightLineDistance>]>(
      Order.mapInput(
        Order.number,
        flow(Tuple.getSecond, ({ data }) => data),
      ),
    ),
  )

  const graphWithNoEdges = Graph.mutate(graph, (mutable) => {
    Array.forEach(sortedEdges, ([edgeIndex]) => {
      Graph.removeEdge(mutable, edgeIndex)
    })
  })

  const [lastSourceNodeIndex, lastTargetNodeIndex] = pipe(
    determineLastConnection(graphWithNoEdges, sortedEdges),
    Tuple.map(Option.getOrThrow),
  )

  return lastSourceNodeIndex.x * lastTargetNodeIndex.x
})

const determineLastConnection = (
  graphWithNoEdges: Graph.Graph<Position, number, 'undirected'>,
  sortedEdges: Array<[number, Graph.Edge<number>]>,
) => {
  let graph: Graph.Graph<Position, number, 'undirected'> = graphWithNoEdges
  let edgeIndex: number = 0
  let circuits: Array<Array<number>> = Graph.connectedComponents(graph)
  let lastAddedNodePositions: [
    source: Option.Option<Position>,
    target: Option.Option<Position>,
  ] = [Option.none(), Option.none()]

  while (Array.length(circuits) !== 1) {
    const nextEdge = Array.unsafeGet(sortedEdges, edgeIndex)

    const { source: sourceNodeIndex, target: targetNodeIndex } =
      Tuple.getSecond(nextEdge)

    const sourceNodeCircuit = Array.findFirst(
      circuits,
      Array.contains(sourceNodeIndex),
    ).pipe(Option.getOrThrow)

    const nodesPartOfSameCircuit = Array.contains(
      sourceNodeCircuit,
      targetNodeIndex,
    )

    if (!nodesPartOfSameCircuit) {
      graph = Graph.mutate(graph, (mutable) =>
        Graph.addEdge(mutable, sourceNodeIndex, targetNodeIndex, 0),
      )
      circuits = Graph.connectedComponents(graph)
      lastAddedNodePositions = [
        Graph.getNode(graph, sourceNodeIndex),
        Graph.getNode(graph, targetNodeIndex),
      ]
    }
    edgeIndex++
  }

  return lastAddedNodePositions
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
