import { Array, Effect, Equal, Option, Order, String, pipe } from 'effect'

import { getLines } from '../common.js'

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  return yield* Effect.reduce(lines, 0, (total, line) => {
    const numbers = pipe(
      line,
      String.split(''),
      Array.map((v): number => parseInt(v)),
    )

    if (!Array.isNonEmptyArray(numbers)) {
      return Effect.fail('Should not be empty')
    }

    const fullLineExceptLast = Array.initNonEmpty(numbers)

    if (!Array.isNonEmptyArray(fullLineExceptLast)) {
      return Effect.fail('Should not be empty')
    }

    const maxFullLineExceptLast = Array.max(fullLineExceptLast, Order.number)

    const indexOfMaxFullLineExceptLast = Array.findFirstIndex(
      numbers,
      Equal.equals(maxFullLineExceptLast),
    )

    if (Option.isNone(indexOfMaxFullLineExceptLast)) {
      return Effect.fail('Max element should be in list')
    }

    const restOfLine = Array.filter(
      numbers,
      (_, index) => index > indexOfMaxFullLineExceptLast.value,
    )

    if (!Array.isNonEmptyArray(restOfLine)) {
      return Effect.fail('Should not be empty')
    }

    const maxRestOfLine = Array.max(restOfLine, Order.number)

    const digits = parseInt(`${maxFullLineExceptLast}${maxRestOfLine}`)

    return Effect.succeed(total + digits)
  })
})
