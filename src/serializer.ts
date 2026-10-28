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

export abstract class EnumSerializer<T> extends Serializer<T> {
  private currentState: 'idle' | 'serializing' | 'deserializing' = 'idle'
  private currentInput: T | number[] | null = null
  private currentOutput: number[] | T | null = null

  protected override serialize(input: T) {
    try {
      const output: number[] = []

      this.currentState = 'serializing'
      this.currentInput = input
      this.currentOutput = output

      this.list()
      return output
    } finally {
      this.currentState = 'idle'
      this.currentInput = null
      this.currentOutput = null
    }
  }

  protected override deserialize(serialized: number[]) {
    try {
      const output = this.getBase()

      this.currentState = 'deserializing'
      this.currentInput = serialized
      this.currentOutput = output

      this.list()
      return output
    } finally {
      this.currentState = 'idle'
      this.currentInput = null
      this.currentOutput = null
    }
  }

  protected enum<K extends keyof T>(
    key: K,
    items: readonly T[K][],
    fromIdx?: number,
  ): T[K] {
    throw 'not implemented'
  }

  protected abstract getBase(): T
  protected abstract list(): void
}
