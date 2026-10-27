import type { Distribution } from './distribution'
import type { DistributionLike } from './protocol'
import type { ArithmeticValue } from './values'

export abstract class Serializer<T> implements DistributionLike<T> {
  constructor(public readonly distribution: Distribution) {}

  encode(input: T) {
    return this.distribution.encode(this.serialize(input))
  }

  decode(value: ArithmeticValue) {
    return this.deserialize(this.distribution.decode(value))
  }

  protected abstract serialize(input: T): number[]
  protected abstract deserialize(serialized: number[]): T
}
