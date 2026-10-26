import type { Distribution } from './distribution'
import type { ArithmeticValue } from './values'

export abstract class Serializer<T> {
  constructor(public readonly distribution: Distribution) {}

  encode(input: T) {
    return this.distribution.encode(this.serialize(input)
  }

  decode(value: ArithmeticValue) {
    return this.deserialize(this.distribution.decode(input))
  }

  protected abstract serialize(input: T): number[]
  protected abstract deseialize(serialized: number[]): T
}
