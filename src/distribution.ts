import { ArithmeticRange, ArithmeticValue } from './values'
import { Fraction } from './fraction'

type _TupleIndicesRecursive<
  T extends unknown[],
  R extends unknown[],
> = T['length'] extends R['length']
  ? R[number]
  : _TupleIndicesRecursive<T, [...R, R['length']]>

type TupleIndices<T extends unknown[]> = number extends T['length']
  ? number
  : _TupleIndicesRecursive<T, []>

const zeroFraction = new Fraction(0n)
const oneFraction = new Fraction(1n)

function stringifyFrac(value: number | bigint | Fraction) {
  return typeof value == 'number' || typeof value == 'bigint'
    ? String(value)
    : `${value.num}/${value.den}`
}

export abstract class Distribution {
  private currentInput: number[] | ArithmeticValue | null = null
  private currentOutput: ArithmeticRange | number[] | null = null
  private currentArrIdx = 0

  encode(data: number[]) {
    try {
      const output = new ArithmeticRange()

      this.currentInput = data
      this.currentOutput = output
      this.currentArrIdx = 0

      this.distribution()
      if (this.currentArrIdx !== data.length) {
        throw RangeError(
          `Too large encoding input ` +
            `(the expected input length was ${this.currentArrIdx}, ` +
            `received ${this.currentInput.length})`,
        )
      }

      return output
    } finally {
      this.currentInput = null
      this.currentOutput = null
      this.currentArrIdx = 0
    }
  }

  decode(value: ArithmeticValue) {
    try {
      const output: number[] = []

      this.currentInput = new ArithmeticValue(value)
      this.currentOutput = output
      this.currentArrIdx = 0

      this.distribution()
      return output
    } finally {
      this.currentInput = null
      this.currentOutput = null
      this.currentArrIdx = 0
    }
  }

  private encodeRange(i: number, fractionRange: Fraction[]) {
    const range = this.currentOutput as ArithmeticRange
    const low = fractionRange[i - 1] ?? zeroFraction
    const high = fractionRange[i] ?? oneFraction

    const {
      den: reducedDen,
      a: reducedLow,
      b: reducedHigh,
    } = Fraction.commonDenominator(low, high)
    if (reducedLow === reducedHigh) {
      throw RangeError(
        `Invalid encoding input data at index ${this.currentArrIdx}: ` +
          `the distribution range of ${i} has zero size`,
      )
    }

    const distancePer1 = range.high - range.low
    // === (range.high * reducedDen - range.low * reducedDen) / reducedDen

    range.den *= reducedDen
    range.low *= reducedDen
    range.high *= reducedDen

    range.high = range.low + distancePer1 * reducedHigh
    range.low = range.low + distancePer1 * reducedLow
  }

  private decodeRange(value: ArithmeticValue, fractionRange: Fraction[]) {
    const output = this.currentOutput as number[]

    let matchedIdx = fractionRange.length
    let matchedPrev = fractionRange[matchedIdx - 1] ?? zeroFraction
    let matchedCurrent = oneFraction

    let prev = zeroFraction
    for (let i = 0; i < fractionRange.length; ++i) {
      const current = fractionRange[i]!
      try {
        const { a, b } = Fraction.commonDenominator(value, current)
        if (a >= b) continue

        const { a: c, b: d } = Fraction.commonDenominator(prev, value)
        if (c > d) continue

        matchedIdx = i
        matchedPrev = prev
        matchedCurrent = current
        break
      } finally {
        // eslint-disable-next-line no-useless-assignment
        prev = current
      }
    }

    const { den, a, b } = Fraction.commonDenominator(matchedPrev, matchedCurrent)
    value.num = value.num * den - a * value.den
    value.den *= b - a

    output.push(matchedIdx)
    return matchedIdx
  }

  /**
   * @example
   * class MyDistribution extends Distribution {
   *   protected override distribution() {
   *     const value = this.range([0.333, 0.667])
   *     if (value === 0) {
   *       this.range([0.5])
   *     }
   *   }
   *   // ...
   * }
   */
  protected range<const T extends (number | Fraction)[]>(
    range: T,
  ): TupleIndices<[0, ...T]> {
    if (this.currentInput === null) {
      throw TypeError('Cannot call Distribution.range() when idle state')
    }

    const fractionRange = range.map((v) => new Fraction(v))
    if (
      fractionRange.some((v, i) => {
        if (v.num < 0n || v.den < v.num) return true
        if (i === 0) return false
        const { a, b } = Fraction.commonDenominator(fractionRange[i - 1]!, v)
        return a > b
      })
    ) {
      throw TypeError(
        `Invalid distribution edges: ${range.map(stringifyFrac).join(', ')}`,
      )
    }

    if (Array.isArray(this.currentInput)) {
      const i = this.currentInput[this.currentArrIdx]
      if (i === undefined) {
        throw RangeError(
          `Too small encoding input ` +
            `(The length of encoding input was ${this.currentInput.length})`,
        )
      }
      if (!Number.isInteger(i) || i < 0 || fractionRange.length < i) {
        throw RangeError(
          `Invalid encoding input data at index ${this.currentArrIdx}: ` +
            `expected integer between 0 ~ ${fractionRange.length}, ` +
            `received ${i}`,
        )
      }

      this.encodeRange(i, fractionRange)
      ++this.currentArrIdx

      return i
    } else {
      const value = this.currentInput
      if (value.num < 0n || value.den < value.num) {
        throw RangeError(
          `Decoding input is out of range 0~1 (received ${stringifyFrac(value)})`,
        )
      }
      return this.decodeRange(value, fractionRange)
    }
  }

  /**
   * @example
   * class MyDistribution extends Distribution {
   *   protected override distribution() {
   *     this.range([0.333, 0.667])
   *     // ...
   *   }
   *   // ...
   * }
   */
  protected abstract distribution(): void
}
