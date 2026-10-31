import { ArithmeticRange, ArithmeticValue } from './values'
import { Fraction } from './fraction'
import type { DistributionLike } from './protocol'

type _TupleIndicesRecursive<
  T extends unknown[],
  R extends unknown[],
> = T['length'] extends R['length']
  ? R[number]
  : _TupleIndicesRecursive<T, [...R, R['length']]>

type TupleIndices<T extends unknown[]> = number extends T['length']
  ? number
  : _TupleIndicesRecursive<T, []>

const zeroFraction = new ArithmeticValue(0n)
const oneFraction = new ArithmeticValue(1n)

export abstract class Distribution implements DistributionLike {
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

      const expectedLength = this.currentArrIdx
      const actualLength = data.length
      if (expectedLength !== actualLength) {
        throw RangeError(
          `Too large encoding input ` +
            `(the expected input length was ${expectedLength}, ` +
            `received ${actualLength})`,
        )
      }

      return output
    } finally {
      this.currentInput = null
      this.currentOutput = null
      this.currentArrIdx = 0
    }
  }

  decode(value: Fraction) {
    try {
      const output: number[] = []

      this.currentInput = new ArithmeticValue(value)
      this.currentOutput = output

      this.distribution()
      return output
    } finally {
      this.currentInput = null
      this.currentOutput = null
    }
  }

  private encodeRange(i: number, fractionRange: ArithmeticValue[]) {
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

  private decodeRange(
    value: ArithmeticValue,
    fractionRange: ArithmeticValue[],
  ) {
    const output = this.currentOutput as number[]

    let matchedIdx = fractionRange.length
    let matchedPrev = fractionRange[matchedIdx - 1] ?? zeroFraction
    let matchedCurrent = oneFraction

    let prev = zeroFraction
    for (let i = 0; i < fractionRange.length; ++i) {
      const current = fractionRange[i]!
      try {
        if (
          value.isGreaterThanOrEqualTo(current) ||
          prev.isGreaterThan(value)
        ) {
          continue
        }

        matchedIdx = i
        matchedPrev = prev
        matchedCurrent = current
        break
      } finally {
        // eslint-disable-next-line no-useless-assignment
        prev = current
      }
    }

    const { den, a, b } = Fraction.commonDenominator(
      matchedPrev,
      matchedCurrent,
    )
    value.num = value.num * den - a * value.den
    value.den *= b - a

    output.push(matchedIdx)
    return matchedIdx
  }

  /**
   * @example
   * class MyDistribution extends Distribution {
   *   protected override distribution() {
   *     const kind = this.range([
   *       // Vegetables
   *       frac(1, 5),
   *       // Fast foods
   *       frac(2, 3),
   *       // Fruits
   *     ])
   *     if (kind === 2) {
   *       const fruit = this.range([
   *         // Apple
   *         0.25,
   *         // Banana
   *         0.625,
   *         // Orange
   *         0.75,
   *         // Strawberry
   *       ])
   *       // ...
   *     }
   *   }
   * }
   */
  protected range<const T extends readonly (number | Fraction)[]>(
    range: T,
  ): TupleIndices<[0, ...T]> {
    if (this.currentInput === null) {
      throw TypeError('Cannot call Distribution.range() when idle state')
    }

    const fractionRange = range.map((v) => new ArithmeticValue(v))

    fractionRange.forEach((v, i) => {
      if (!v.isValid) {
        throw RangeError(
          `Invalid distribution edge at index ${i}: ` +
            `${v} is out of range 0 ~ 1 (provided ${range.join(', ')})`,
        )
      }

      if (i === 0) return
      const prev = fractionRange[i - 1]!
      if (prev.isGreaterThan(v)) {
        throw TypeError(
          `Invalid distribution edges at index ${i - 1} / ${i}: ` +
            `${prev} > ${v} (provided ${range.join(', ')})`,
        )
      }
    })

    if (Array.isArray(this.currentInput)) {
      const i = this.currentInput[this.currentArrIdx]
      if (i === undefined) {
        throw RangeError(
          `Too small encoding input (received ` +
            `(${this.currentInput.length}) [${this.currentInput.join(', ')}])`,
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
      if (!value.isValid) {
        throw RangeError(
          `Decoding input is out of range 0 ~ 1 (received ${value})`,
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
   *     this.range([frac(1, 3), frac(2, 3)])
   *     // ...
   *   }
   *   // ...
   * }
   */
  protected abstract distribution(): void
}
