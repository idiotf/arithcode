import assert from 'node:assert'
import seedrandom from 'seedrandom'
import { describe, it } from 'node:test'
import {
  ArithmeticRange,
  ArithmeticValue,
  DigitCoder,
  type StringCoder,
} from '../src'

describe('string-coder.ts', () => {
  describe('DigitCoder', () => {
    class TestOnlyCoder extends DigitCoder {
      protected override charMap = '0123456789'
    }

    class BrokenEmojiCoder extends DigitCoder {
      protected override charMap =
        '\ud83d\ude01\u2764\ud83e\udde1\udc9b\udc9a\udc99\udc9c\udd0e\udda4\udd0d\ude77\udc94\udc91\udc69\u200d\ufe0f\udc68\udc8f\udc8b\udc6a\udc66\udc67'
    }

    class UnicodeCoder extends DigitCoder {
      protected override charMap = Array.from({ length: 65536 }, (_, i) =>
        String.fromCharCode(i),
      ).join('')
    }

    const coder = new TestOnlyCoder()
    const emojiCoder = new BrokenEmojiCoder()
    const unicodeCoder = new UnicodeCoder()

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

      for (const [encoded, expectedDecoded] of decodingTests) {
        assert.deepStrictEqual(coder.decode(encoded), expectedDecoded)
      }
    })

    describe('decode(encode())', () => {
      const random = seedrandom('string-coder encoding / decoding test seed')
      const tests = [
        new ArithmeticRange(),
        new ArithmeticRange(2n, 0n, 1n),
        new ArithmeticRange(2n, 1n, 2n),
        ...Array.from({ length: 100 }, () => {
          const den = Math.floor(random() * 1234 + 1)
          const low = Math.floor(random() * den)
          return new ArithmeticRange(BigInt(den), BigInt(low), BigInt(low + 1))
        }),
        ...Array.from({ length: 100 }, () => {
          const den = Math.floor(random() * 1234 + 1)

          const a = Math.floor(random() * (den + 1))
          const bTmp = Math.floor(random() * den)
          const b = bTmp >= a ? bTmp + 1 : bTmp

          const low = a < b ? a : b
          const high = a < b ? b : a
          return new ArithmeticRange(BigInt(den), BigInt(low), BigInt(high))
        }),
      ]

      function testWith(coder: StringCoder) {
        for (const test of tests) {
          const decoded = coder.decode(coder.encode(test))
          assert(decoded.isValid, 'decoded.isValid')
          assert(
            test.lowAbs * decoded.denAbs <= decoded.numAbs * test.denAbs,
            'low <= decoded',
          )
          assert(
            decoded.numAbs * test.denAbs < test.highAbs * decoded.denAbs,
            'decoded < high',
          )
        }
      }

      it('Common', () => testWith(coder))
      it('Emoji coder', () => testWith(emojiCoder))
      it('Unicode coder', () => testWith(unicodeCoder))
    })
  })
})
