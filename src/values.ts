import { Fraction } from './fraction'

export class ArithmeticRange {
  constructor(
    public den = 1n,
    public low = 0n,
    public high = 1n,
  ) {}
}

export class ArithmeticValue extends Fraction {}
