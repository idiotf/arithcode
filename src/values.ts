import { Fraction } from './fraction'
import { abs } from './utils'

export class ArithmeticRange {
  constructor(
    public den = 1n,
    public low = 0n,
    public high = den,
  ) {}

  get isValid() {
    const sign = this.den < 0n ? -1n : 1n
    const den = this.den * sign
    const low = this.low * sign
    const high = this.high * sign
    return 0n <= low && low < high && high <= den
  }

  get denAbs() {
    if (!this.isValid) {
      throw RangeError(
        `Cannot get ArithmeticRange.denAbs when not valid (received ${this})`,
      )
    }

    return abs(this.den)
  }

  get lowAbs() {
    if (!this.isValid) {
      throw RangeError(
        `Cannot get ArithmeticRange.lowAbs when not valid (received ${this})`,
      )
    }

    return abs(this.low)
  }

  get highAbs() {
    if (!this.isValid) {
      throw RangeError(
        `Cannot get ArithmeticRange.highAbs when not valid (received ${this})`,
      )
    }

    return abs(this.high)
  }

  toString() {
    return `${this.low} ~ ${this.high} / ${this.den}`
  }
}

export class ArithmeticValue extends Fraction {
  get isValid() {
    const sign = this.den < 0n ? -1n : 1n
    const num = this.num * sign
    const den = this.den * sign
    return den !== 0n && 0n <= num && num <= den
  }

  get denAbs() {
    if (!this.isValid) {
      throw RangeError(
        `Cannot get ArithmeticValue.denAbs when not valid (received ${this})`,
      )
    }

    return abs(this.den)
  }

  get numAbs() {
    if (!this.isValid) {
      throw RangeError(
        `Cannot get ArithmeticValue.numAbs when not valid (received ${this})`,
      )
    }

    return abs(this.num)
  }
}
