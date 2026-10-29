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

  private getArrIdxFrom(fromIdx: number | undefined): number {
    throw 'not impl'
  }

  protected enum<K extends keyof T>(
    key: K,
    items: readonly T[K][],
    fromIdx?: number,
  ): T[K] {
    if (this.currentState === 'idle') {
      throw TypeError('Cannot call EnumSerializer.enum() when idle state')
    }

    const idx = this.getArrIdxFrom(fromIdx)

    if (this.currentState === 'serializing') {
      throw 'not implemented'
    } else {
      const input = this.currentInput as number[]
      const output = this.currentOutput as T

      if (idx >= input.length) {
        throw RangeError(`input is too small`)
      }
      const inputItem = input[idx]!
      if (!Number.isInteger(inputItem) || inputItem < 0 || items.length <= inputItem) {
        throw RangeError(`Unrecognized item`)
      }

      output[key] = items[inputItem]!
    }
  }

  protected abstract getBase(): T
  protected abstract list(): void
}
