import { Fraction } from './fraction'

export class ArithmeticRange {
  constructor(
    public den = 1n,
    public low = 0n,
    public high = den,
  ) {}
}

export class ArithmeticValue extends Fraction {}
