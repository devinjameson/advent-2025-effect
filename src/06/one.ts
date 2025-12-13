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

  const operations = pipe(
    lines,
    Array.last,
    Option.getOrThrow,
    String.trim,
    String.split(''),
    Array.filter(flow(String.trim, String.isNonEmpty)),
  )

  return pipe(
    lines,
    Array.init,
    Option.getOrThrow,
    Array.reduce<Array<Option.Option<number>>, string>(
      Array.makeBy(Array.length(operations), () => Option.none()),
      (columnTotals, line) => {
        const values = pipe(
          line,
          String.trim,
          String.split(''),
          Array.reduce<
            {
              values: Array<Array<string>>
              valuesIndex: number
              prevValue: Option.Option<string>
            },
            string
          >(
            { values: [], valuesIndex: 0, prevValue: Option.none() },
            ({ values, valuesIndex, prevValue }, value) => {
              const isPrevValueNonEmpty = Option.exists(
                prevValue,
                flow(String.trim, String.isNonEmpty),
              )
              if (String.isEmpty(String.trim(value))) {
                const nextValuesIndex = isPrevValueNonEmpty
                  ? Number.increment(valuesIndex)
                  : valuesIndex

                return {
                  values,
                  valuesIndex: nextValuesIndex,
                  prevValue: Option.some(value),
                }
              } else {
                const nextValues = isPrevValueNonEmpty
                  ? Array.modify(values, valuesIndex, Array.append(value))
                  : Array.append(values, [value])

                return {
                  values: nextValues,
                  valuesIndex,
                  prevValue: Option.some(value),
                }
              }
            },
          ),
          ({ values }) => values,
          Array.map(flow(Array.join(''), Number.parse, Option.getOrThrow)),
        )

        return Array.map(columnTotals, (maybeColumnTotal, columnIndex) =>
          Option.match(maybeColumnTotal, {
            onNone: () => Array.get(values, columnIndex),
            onSome: (columnTotal) =>
              Option.all([
                Array.get(operations, columnIndex),
                Array.get(values, columnIndex),
              ]).pipe(Option.getOrThrow, ([operation, value]) =>
                Match.value(operation).pipe(
                  Match.when('*', () => columnTotal * value),
                  Match.when('+', () => columnTotal + value),
                  Match.option,
                ),
              ),
          }),
        )
      },
    ),
    Array.getSomes,
    Array.reduce(0, (sum, value) => sum + value),
  )
})
