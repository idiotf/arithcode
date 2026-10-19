import { Fraction } from './fraction'

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

  toString() {
    return `${this.low} ~ ${this.high} / ${this.den}`
  }
}

export class ArithmeticValue extends Fraction {
  get isValid() {
    const sign = this.den < 0n ? -1n : 1n
    const num = this.num * sign
    const den = this.den * sign
    return 0n <= num && num <= den
  }
}
