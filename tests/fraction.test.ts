import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Fraction } from '../src/fraction'

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

    for (const input of [NaN, Infinity, -Infinity]) {
      assert.throws(() => {
        new Fraction(input)
      })
    }
  })
})
