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

export type { DistributionCtx }
class DistributionCtx {
  private currentArrIdx = 0

  constructor(
    private currentInput: number[] | ArithmeticValue | null = null,
    private currentOutput: ArithmeticRange | number[] | null = null,
  ) {}

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

      if (value.isGreaterThanOrEqualTo(current)) {
        prev = current
        continue
      }

      matchedIdx = i
      matchedPrev = prev
      matchedCurrent = current
      break
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

  use<T>(distribution: DistributionSerializerPeer<unknown, T>) {
    if (this.currentInput === null) {
      throw TypeError('Cannot call DistributionCtx.use() after disposed')
    }

    return distribution['distribution'](this)
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
  range<const T extends readonly (number | Fraction)[]>(
    range: T,
  ): TupleIndices<[0, ...T]> {
    if (this.currentInput === null) {
      throw TypeError('Cannot call DistributionCtx.range() after disposed')
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
}

export abstract class DistributionSerializerPeer<
  T,
  TDistOutput = unknown,
> implements DistributionLike<T> {
  encode(data: T) {
    const serialized = this.serialize(data)
    const output = new ArithmeticRange()

    const ctx = new DistributionCtx(serialized, output)
    this.distribution(ctx)
    ctx['currentInput'] = null

    const expectedLength = ctx['currentArrIdx']
    const actualLength = serialized.length
    if (expectedLength !== actualLength) {
      throw RangeError(
        `Too large encoding input ` +
          `(the expected input length was ${expectedLength}, ` +
          `received ${actualLength})`,
      )
    }

    return output
  }

  decode(value: Fraction) {
    const output: number[] = []

    const ctx = new DistributionCtx(new ArithmeticValue(value), output)
    const distributionOutput = this.distribution(ctx)
    ctx['currentInput'] = null

    return this.deserialize(output, distributionOutput)
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
  protected abstract distribution(ctx: DistributionCtx): TDistOutput

  protected abstract serialize(input: T): number[]
  protected abstract deserialize(
    serialized: number[],
    distributionOutput: TDistOutput,
  ): T
}

export abstract class DistributionSerializer<
  T,
> extends DistributionSerializerPeer<T, T> {
  protected override deserialize(_: unknown, output: T) {
    return output
  }
}

export abstract class Distribution extends DistributionSerializerPeer<
  number[]
> {
  protected override serialize(input: number[]) {
    return input
  }

  protected override deserialize(serialized: number[]) {
    return serialized
  }
}
