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

export abstract class EnumSerializer<T extends object> extends Serializer<T> {
  private currentState: 'idle' | 'serializing' | 'deserializing' = 'idle'
  private currentInput: T | number[] | null = null
  private currentOutput: number[] | T | null = null
  private currentDefaultArrIdx = 0
  private cntReadArrIdx = 0
  private accessedInputKeys = new Set<PropertyKey>()
  private accessedOutputKeys = new Set<PropertyKey>()

  protected override serialize(input: T) {
    try {
      const output: number[] = []

      this.currentState = 'serializing'
      this.currentInput = input
      this.currentOutput = output
      this.currentDefaultArrIdx = 0
      this.cntReadArrIdx = 0
      this.accessedInputKeys.clear()
      this.accessedOutputKeys.clear()

      this.list()
      this.verifyEnumCalls(output.length)

      return output
    } finally {
      this.resetInternalStates()
    }
  }

  protected override deserialize(serialized: number[]) {
    try {
      const output = this.getBase()

      this.currentState = 'deserializing'
      this.currentInput = serialized
      this.currentOutput = output
      this.currentDefaultArrIdx = 0
      this.cntReadArrIdx = 0
      this.accessedInputKeys.clear()
      this.accessedOutputKeys.clear()

      this.list()
      this.verifyEnumCalls(serialized.length)

      return output
    } finally {
      this.resetInternalStates()
    }
  }

  private resetInternalStates() {
    this.currentState = 'idle'
    this.currentInput = null
    this.currentOutput = null
    this.currentDefaultArrIdx = 0
    this.cntReadArrIdx = 0
    this.accessedInputKeys.clear()
    this.accessedOutputKeys.clear()
  }

  private verifyEnumCalls(
    expectedCalls: number,
    actualCalls = this.cntReadArrIdx,
  ) {
    if (expectedCalls !== actualCalls) {
      throw RangeError(
        `Too few EnumSerializer.enum() calls ` +
          `(the expected count of calls was ${expectedCalls}, ` +
          `received ${actualCalls})`,
      )
    }
  }

  private getArrIdxFrom(fromIdx: number | undefined): number {
    if (fromIdx !== undefined) {
      if (!Number.isInteger(fromIdx) || fromIdx < 0) {
        throw RangeError(
          `The fromIdx must be a non-negative integer; received ${fromIdx}`,
        )
      }

      return fromIdx
    } else {
      if (this.currentDefaultArrIdx === -1) {
        throw TypeError(
          'Cannot set fromIdx to undefined because it was provided before',
        )
      }

      return this.currentDefaultArrIdx
    }
  }

  private updateArrIdx(overrideDefaultArrIdx: boolean) {
    if (overrideDefaultArrIdx) {
      this.currentDefaultArrIdx = -1
    } else if (this.currentDefaultArrIdx !== -1) {
      ++this.currentDefaultArrIdx
    }
    ++this.cntReadArrIdx
  }

  private inputHasKey(input: T, key: keyof T) {
    return key in input
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
      if (this.accessedOutputKeys.has(idx)) {
        throw TypeError(`Cannot write output[${idx}] twice`)
      }

      const input = this.currentInput as T
      const output = this.currentOutput as number[]

      if (this.accessedInputKeys.has(key)) {
        throw TypeError(`Cannot read input[${String(key)}] twice`)
      }
      if (!this.inputHasKey(input, key)) {
        throw TypeError(
          `Cannot read input[${String(key)}] because ` +
            `it doesn't exist in input. If it was an optional prop, ` +
            `consider setting it undefined and recognizing undefined in items.`,
        )
      }
      const enumItem = input[key] as T[K]

      const outputItem = items.findIndex((v) => Object.is(v, enumItem))
      if (outputItem === -1) {
        throw TypeError(
          `Unrecognized item in input[${String(key)}]: ${String(enumItem)}`,
        )
      }

      this.accessedInputKeys.add(key)
      this.accessedOutputKeys.add(idx)
      this.updateArrIdx(fromIdx !== undefined)
      return enumItem
    } else {
      if (this.accessedOutputKeys.has(key)) {
        throw TypeError(`Cannot write output[${String(key)}] twice`)
      }

      const input = this.currentInput as number[]
      const output = this.currentOutput as T

      if (idx >= input.length) {
        throw RangeError(
          `Too small decoding input (received ` +
            `(${input.length}) [${input.join(', ')}])`,
        )
      }
      if (this.accessedInputKeys.has(idx)) {
        throw TypeError(`Cannot write output[${String(key)}] twice`)
      }
      const inputItem = input[idx]!

      if (
        !Number.isInteger(inputItem) ||
        inputItem < 0 ||
        items.length <= inputItem
      ) {
        throw RangeError(`Unrecognized item at index ${idx}: ${inputItem}`)
      }
      const enumItem = items[inputItem] as T[K]
      output[key] = enumItem

      this.accessedInputKeys.add(idx)
      this.accessedOutputKeys.add(key)
      this.updateArrIdx(fromIdx !== undefined)
      return enumItem
    }
  }

  protected assert<K extends keyof T>(key: K, expected: T[K]) {
    if (this.currentState === 'idle') {
      throw TypeError('Cannot call EnumSerializer.assert() when idle state')
    }

    if (this.accessedOutputKeys.has(key)) {
      throw TypeError(`Cannot write output[${String(key)}] twice`)
    }

    if (this.currentState === 'serializing') {
      const input = this.currentInput as T
      if (!this.inputHasKey(input, key)) {
        throw TypeError(
          `Cannot read input[${String(key)}] because it doesn't exist in input`,
        )
      }

      const actual = input[key]
      if (!Object.is(actual, expected)) {
        throw TypeError(
          `Assertion failed: expected input[${String(key)}] was ` +
            `${JSON.stringify(expected)} but received ` +
            `${JSON.stringify(actual)}`,
        )
      }
    } else {
      const output = this.currentOutput as T
      output[key] = expected
    }
  }

  protected abstract getBase(): T
  protected abstract list(): void
}
