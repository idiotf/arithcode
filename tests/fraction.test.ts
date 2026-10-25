import assert from 'node:assert'
import { describe, it } from 'node:test'
import { frac, Fraction } from '../src/fraction'

describe('fraction.ts', () => {
  it('new Fraction', () => {
    const tests: [input: number, num: bigint, den: bigint][] = [
      [0, 0n, 1n],
      [-0, 0n, 1n],
      [1, 1n, 1n],
      [-1, -1n, 1n],
      [0.5, 1n, 2n],
      [0.25, 1n, 4n],
      [1.5, 3n, 2n],
      [Number.EPSILON, 1n, 1n << 52n],
      [Number.MIN_VALUE, 1n, 1n << 1074n],
      [2 ** -1022, 1n, 1n << 1022n],
      [1.1, 2476979795053773n, 2251799813685248n],
      [1 / 3, 6004799503160661n, 18014398509481984n],
      [Math.PI, 884279719003555n, 281474976710656n],
      [Math.E, 6121026514868073n, 2251799813685248n],
    ]

    for (const [input, num, den] of tests) {
      const result = new Fraction(input)
      assert.strictEqual(result.num, num)
      assert.strictEqual(result.den, den)
    }

    const throwingTests = [NaN, Infinity, -Infinity]

    for (const input of throwingTests) {
      assert.throws(() => {
        new Fraction(input)
      })
    }
  })

  describe('Fraction.commonDenominator', () => {
    function testIt(
      aNum: bigint,
      aDen: bigint,
      bNum: bigint,
      bDen: bigint,
      expectedA: bigint,
      expectedB: bigint,
      expectedDen: bigint,
    ) {
      const result = Fraction.commonDenominator(
        frac(aNum, aDen),
        frac(bNum, bDen),
      )
      assert.deepStrictEqual(result, {
        den: expectedDen,
        a: expectedA,
        b: expectedB,
      })
    }

    function testAll(
      tests: [
        a: Fraction,
        b: Fraction,
        expected: [a: bigint, b: bigint, den: bigint],
      ][],
    ) {
      for (const [a, b, expected] of tests) {
        const { num: aNum, den: aDen } = a
        const { num: bNum, den: bDen } = b
        const [expectedA, expectedB, expectedDen] = expected

        testIt(aNum, aDen, bNum, bDen, expectedA, expectedB, expectedDen)
        testIt(aNum, aDen, bNum, -bDen, expectedA, -expectedB, expectedDen)
        testIt(aNum, aDen, -bNum, bDen, expectedA, -expectedB, expectedDen)
        testIt(aNum, aDen, -bNum, -bDen, expectedA, expectedB, expectedDen)
        testIt(aNum, -aDen, bNum, bDen, -expectedA, expectedB, expectedDen)
        testIt(aNum, -aDen, bNum, -bDen, -expectedA, -expectedB, expectedDen)
        testIt(aNum, -aDen, -bNum, bDen, -expectedA, -expectedB, expectedDen)
        testIt(aNum, -aDen, -bNum, -bDen, -expectedA, expectedB, expectedDen)
        testIt(-aNum, aDen, bNum, bDen, -expectedA, expectedB, expectedDen)
        testIt(-aNum, aDen, bNum, -bDen, -expectedA, -expectedB, expectedDen)
        testIt(-aNum, aDen, -bNum, bDen, -expectedA, -expectedB, expectedDen)
        testIt(-aNum, aDen, -bNum, -bDen, -expectedA, expectedB, expectedDen)
        testIt(-aNum, -aDen, bNum, bDen, expectedA, expectedB, expectedDen)
        testIt(-aNum, -aDen, bNum, -bDen, expectedA, -expectedB, expectedDen)
        testIt(-aNum, -aDen, -bNum, bDen, expectedA, -expectedB, expectedDen)
        testIt(-aNum, -aDen, -bNum, -bDen, expectedA, expectedB, expectedDen)
      }
    }

    it('Common', () => {
      testAll([
        [frac(1, 3), frac(2, 5), [5n, 6n, 15n]],
        [frac(1, 5), frac(2, 5), [1n, 2n, 5n]],
        [frac(3, 15), frac(5, 25), [15n, 15n, 75n]],
        [frac(123, 512), frac(456, 513), [63099n, 233472n, 262656n]],
        [frac(123, 48), frac(234, 576), [1476n, 234n, 576n]],
        [frac(123, 48), frac(234, 196), [6027n, 2808n, 2352n]],
      ])
    })

    it('Power-of-two denominators', () => {
      testAll([
        [frac(1, 2), frac(1, 4), [2n, 1n, 4n]],
        [frac(152, 65536), frac(256, 256), [152n, 65536n, 65536n]],
      ])
    })

    it('Invalid denominators', () => {
      assert.throws(() => Fraction.commonDenominator(frac(1, 0), frac(3, 2)))
      assert.throws(() => Fraction.commonDenominator(frac(2, 0), frac(1, 0)))
      assert.throws(() => Fraction.commonDenominator(frac(0, 2), frac(1, 0)))
    })
  })
})
