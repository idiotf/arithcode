import { gcd } from './utils'

export function frac(num: number | bigint, den: number | bigint): Fraction
export function frac(value: number | bigint | Fraction): Fraction

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function frac(a: any, b?: any) {
  return new Fraction(a, b)
}

export class Fraction {
  static commonDenominator(a: Fraction, b: Fraction) {
    if (!a.den || !b.den) {
      throw RangeError(
        `Division by zero (getting commonDenominator of ${a} and ${b})`,
      )
    }

    const aSign = a.den < 0n ? -1n : 1n
    const aNum = a.num * aSign
    const aDen = a.den * aSign

    const bSign = b.den < 0n ? -1n : 1n
    const bNum = b.num * bSign
    const bDen = b.den * bSign

    const gcdValue = gcd(aDen, bDen)
    return {
      den: (aDen / gcdValue) * bDen,
      a: (bDen / gcdValue) * aNum,
      b: (aDen / gcdValue) * bNum,
    }
  }

  num: bigint
  den: bigint

  constructor(num: number | bigint, den: number | bigint)
  constructor(value: number | bigint | Fraction)

  constructor(a: number | bigint | Fraction, b?: number | bigint) {
    if (b !== undefined) {
      this.num = BigInt(a as number | bigint)
      this.den = BigInt(b)
      return
    }

    if (typeof a == 'bigint' || Number.isInteger(a)) {
      this.num = BigInt(a as number)
      this.den = 1n
      return
    }

    if (a instanceof Fraction) {
      this.num = a.num
      this.den = a.den
      return
    }

    if (!Number.isFinite(a)) {
      throw TypeError(
        'Only finite numbers can be converted to fraction; received ' + a,
      )
    }

    const view = new DataView(new ArrayBuffer(8))
    view.setFloat64(0, a)
    const bits = view.getBigUint64(0)
    const sign = bits >> 63n ? -1n : 1n
    const exponent = (bits >> 52n) & 0x7ffn
    const fraction = bits & 0xfffffffffffffn

    let num = sign * (exponent ? 0x10000000000000n | fraction : fraction)
    let log2den = exponent ? 1075n - exponent : 1074n
    while (log2den && !(num & 1n)) {
      num >>= 1n
      log2den -= 1n
    }

    this.num = num
    this.den = 2n ** log2den
  }

  isLessThan(b: Fraction) {
    if (!this.den || !b.den) {
      throw RangeError(
        `Division by zero (checking isLessThan for ${this} and ${b})`,
      )
    }

    const aSign = this.den < 0n ? -1n : 1n
    const aNum = this.num * aSign
    const aDen = this.den * aSign

    const bSign = b.den < 0n ? -1n : 1n
    const bNum = b.num * bSign
    const bDen = b.den * bSign

    return aNum * bDen < bNum * aDen
  }

  isGreaterThan(b: Fraction) {
    if (!this.den || !b.den) {
      throw RangeError(
        `Division by zero (checking isGreaterThan for ${this} and ${b})`,
      )
    }

    return b.isLessThan(this)
  }

  isLessThanOrEqualTo(b: Fraction) {
    if (!this.den || !b.den) {
      throw RangeError(
        `Division by zero (checking isLessThanOrEqualTo for ${this} and ${b})`,
      )
    }

    return !b.isLessThan(this)
  }

  isGreaterThanOrEqualTo(b: Fraction) {
    if (!this.den || !b.den) {
      throw RangeError(
        `Division by zero (checking isGreaterThanOrEqualTo for ${this} and ${b})`,
      )
    }

    return !this.isLessThan(b)
  }

  reduce() {
    const gcdValue = gcd(this.num, this.den)
    this.num /= gcdValue
    this.den /= gcdValue
  }

  toReduced() {
    const gcdValue = gcd(this.num, this.den)
    return new Fraction(this.num / gcdValue, this.den / gcdValue)
  }

  toString() {
    return `${this.num}/${this.den}`
  }
}
