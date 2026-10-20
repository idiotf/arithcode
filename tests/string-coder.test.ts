import assert from 'node:assert'
import { describe, it } from 'node:test'
import { ArithmeticRange, ArithmeticValue, DigitCoder } from '../src'

describe('string-coder.ts', () => {
  describe('DigitCoder', () => {
    class TestOnlyCoder extends DigitCoder {
      protected override charMap = '0123456789'
    }

    describe('encode', () => {
      const encodingTests: [range: ArithmeticRange, expectedEncoded: string][] =
        [
          [new ArithmeticRange(10n, 1n, 2n), '1'],
          [new ArithmeticRange(10n, 1n, 3n), '2'],
          [new ArithmeticRange(20n, 2n, 6n), '2'],
          [new ArithmeticRange(10n, 7n, 8n), '7'],
          [new ArithmeticRange(20n, 14n, 16n), '7'],
          [new ArithmeticRange(100n, 7n, 8n), '07'],
          [new ArithmeticRange(100n, 17n, 18n), '17'],
          [new ArithmeticRange(100n, 50n, 51n), ''],
          [new ArithmeticRange(101n, 50n, 51n), ''],
          [new ArithmeticRange(101n, 49n, 50n), '49'],
        ]

      const coder = new TestOnlyCoder()

      it('Common', () => {
        for (const [range, expectedEncoded] of encodingTests) {
          const actualEncoded = coder.encode(range)
          assert.deepStrictEqual(actualEncoded, expectedEncoded)
        }
      })

      it('Sign flipped', () => {
        for (const [range, expectedEncoded] of encodingTests) {
          const signFlipped = new ArithmeticRange(
            -range.den,
            -range.low,
            -range.high,
          )

          const actualEncoded = coder.encode(signFlipped)
          assert.deepStrictEqual(actualEncoded, expectedEncoded)
        }
      })
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
        ['49', new ArithmeticValue(99n, 200n)],
      ]

      const coder = new TestOnlyCoder()
      for (const [encoded, expectedDecoded] of decodingTests) {
        assert.deepStrictEqual(coder.decode(encoded), expectedDecoded)
      }
    })
  })
})
