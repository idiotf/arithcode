import assert from 'node:assert'
import { describe, it } from 'node:test'
import { ArithmeticRange, ArithmeticValue, DigitCoder } from '../src'

describe('string-coder.ts', () => {
  describe('DigitCoder', () => {
    const charMap = '0123456789'
    class TestOnlyCoder extends DigitCoder {
      protected override charMap = charMap
    }

    it('encode', () => {
      const encodingTests: [range: ArithmeticRange, expectedEncoded: string][] =
        [
          [new ArithmeticRange(10n, 1n, 2n), '1'],
          [new ArithmeticRange(10n, 1n, 3n), '2'],
          [new ArithmeticRange(10n, 7n, 8n), '7'],
          [new ArithmeticRange(100n, 7n, 8n), '07'],
          [new ArithmeticRange(100n, 17n, 18n), '17'],
        ]

      const coder = new TestOnlyCoder()
      for (const [range, expectedEncoded] of encodingTests) {
        assert.deepStrictEqual(coder.encode(range), expectedEncoded)
      }
    })

    it('decode', () => {
      const decodingTests: [
        encoded: string,
        expectedDecoded: ArithmeticValue,
      ][] = [
        ['', new ArithmeticValue(1n, 2n)],
        ['0', new ArithmeticValue(1n, 20n)],
        ['3', new ArithmeticValue(7n, 20n)],
        ['03', new ArithmeticValue(7n, 200n)],
      ]

      const coder = new TestOnlyCoder()
      for (const [encoded, expectedDecoded] of decodingTests) {
        assert.deepStrictEqual(coder.decode(encoded), expectedDecoded)
      }
    })
  })
})
