import { Array, flow, Match, String } from 'effect'

import { input } from './input'

const DIAL_SIZE = 100
const DIAL_START = 50

const run = flow(
  String.split('\n'),
  Array.reduce({ position: DIAL_START, totalZeroes: 0 }, (acc, line) => {
    const nextPosition =
      Match.value(line).pipe(
        Match.when(
          String.startsWith('R'),
          (str) => acc.position + restOfStringAsNumber(str),
        ),
        Match.when(
          String.startsWith('L'),
          (str) => acc.position - restOfStringAsNumber(str),
        ),
        Match.orElseAbsurd,
      ) % DIAL_SIZE

    const nextTotalZeroes =
      nextPosition === 0 ? acc.totalZeroes + 1 : acc.totalZeroes

    return {
      position: nextPosition,
      totalZeroes: nextTotalZeroes,
    }
  }),
  ({ totalZeroes }) => totalZeroes,
)

const restOfStringAsNumber = (str: string): number =>
  parseInt(String.slice(1)(str))

console.time('solution')
const result = run(input)
console.timeEnd('solution')
console.log(result)
