import type { Distribution } from './distribution'
import type { StringCoder } from './string-coder'
import type { ArithmeticRange, ArithmeticValue } from './values'

export interface DistributionLike<T = number[]> {
  encode(input: T): ArithmeticRange
  decode(value: ArithmeticValue): T
}

export type DistributionInput<T extends DistributionLike<unknown>> =
  T extends DistributionLike<infer I> ? I : never

export class Protocol<T extends DistributionLike<unknown> = Distribution> {
  constructor(
    public distribution: T,
    public coder: StringCoder,
  ) {}

  encode(data: DistributionInput<T>) {
    return this.coder.encode(this.distribution.encode(data))
  }

  decode(code: string) {
    return this.distribution.decode(
      this.coder.decode(code),
    ) as DistributionInput<T>
  }
}
