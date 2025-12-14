import {
  Array,
  Effect,
  Match,
  Number,
  Option,
  String,
  flow,
  pipe,
} from 'effect'

import { getLines } from '../common.js'

export const solution = Effect.gen(function* () {
  const lines = yield* getLines('input.txt')

  const lastLine = pipe(lines, Array.last, Option.getOrThrow)

  const operations = pipe(
    lastLine,
    String.trim,
    String.split(''),
    Array.filter(flow(String.trim, String.isNonEmpty)),
    Array.reverse,
  )

  return pipe(
    lines,
    Array.init,
    Option.getOrThrow,
    Array.map(flow(String.split(''), Array.reverse)),
    Array.reduce<Array<Option.Option<string>>, Array<string>>(
      Array.makeBy(String.length(lastLine), () => Option.none()),
      (values, strings) => {
        return Array.zipWith(values, strings, (value, string) =>
          pipe(
            value,
            Option.match({
              onNone: () => string,
              onSome: String.concat(string),
            }),
            Option.some,
          ),
        )
      },
    ),
    Array.map(Option.flatMap(Number.parse)),
    Array.reduce<
      { columnTotals: Array<Option.Option<number>>; columnIndex: number },
      Option.Option<number>
    >(
      {
        columnTotals: Array.makeBy(Array.length(operations), () =>
          Option.none(),
        ),
        columnIndex: 0,
      },
      ({ columnTotals, columnIndex }, maybeNumber) => {
        return Option.match(maybeNumber, {
          onNone: () => ({
            columnTotals,
            columnIndex: Number.increment(columnIndex),
          }),
          onSome: (number) => {
            const operation = Array.get(operations, columnIndex).pipe(
              Option.getOrThrow,
            )
            const nextColumnTotals = Array.modify(
              columnTotals,
              columnIndex,
              (columnTotal) =>
                Match.value(operation).pipe(
                  Match.when('*', () =>
                    Option.match(columnTotal, {
                      onNone: () => number,
                      onSome: Number.multiply(number),
                    }),
                  ),
                  Match.when('+', () =>
                    Option.match(columnTotal, {
                      onNone: () => number,
                      onSome: Number.sum(number),
                    }),
                  ),
                  Match.option,
                ),
            )
            return { columnTotals: nextColumnTotals, columnIndex }
          },
        })
      },
    ),
    ({ columnTotals }) => columnTotals,
    Array.getSomes,
    Number.sumAll,
  )
})
