import { gcd, isPowerOfTwo } from './utils'

export function frac(num: number | bigint, den: number | bigint): Fraction
export function frac(value: number | bigint | Fraction): Fraction

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function frac(a: any, b?: any) {
  return new Fraction(a, b)
}

export class Fraction {
  private static readonly view = new DataView(new ArrayBuffer(8))

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

    Fraction.view.setFloat64(0, a)
    const bits = Fraction.view.getBigUint64(0)
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

  static commonDenominator(a: Fraction, b: Fraction) {
    let den, aNum, bNum

    if (isPowerOfTwo(a.den) && isPowerOfTwo(b.den)) {
      if (a.den > b.den) {
        den = a.den
        aNum = a.num
        bNum = (a.den / b.den) * b.num
      } else {
        den = b.den
        aNum = (b.den / a.den) * a.num
        bNum = b.num
      }
    } else {
      const gcdValue = gcd(a.den, b.den)
      den = (a.den / gcdValue) * b.den
      aNum = (b.den / gcdValue) * a.num
      bNum = (a.den / gcdValue) * b.num
    }

    return { den, a: aNum, b: bNum }
  }
}
