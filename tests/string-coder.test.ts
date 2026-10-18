import assert from 'node:assert'
import { describe, it } from 'node:test'
import { ArithmeticValue, DigitCoder } from '../src'

describe('string-coder.ts', () => {
  it('DigitCoder', () => {
    const charMap = '0123456789'
    const decodingTests: [encoded: string, expectedDecoded: ArithmeticValue][] =
      [
        ['', new ArithmeticValue(1n, 2n)],
        ['0', new ArithmeticValue(1n, 20n)],
        ['3', new ArithmeticValue(7n, 20n)],
        ['03', new ArithmeticValue(7n, 200n)],
      ]

    class TestOnlyCoder extends DigitCoder {
      protected override charMap = charMap
    }

    const coder = new TestOnlyCoder()
    for (const [encoded, expectedDecoded] of decodingTests) {
      assert.deepStrictEqual(coder.decode(encoded), expectedDecoded)
    }
  })
})
