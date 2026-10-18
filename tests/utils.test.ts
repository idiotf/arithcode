import assert from 'node:assert'
import { describe, it } from 'node:test'
import { gcd } from '../src/utils'

describe('utils.ts', () => {
  it('gcd', () => {
    const tests: [a: bigint, b: bigint, expected: bigint][] = [
      [48n, 18n, 6n],
      [7n, 13n, 1n],
      [100n, 25n, 25n],
      [0n, 12n, 12n],
      [12n, 0n, 12n],
      [0n, 0n, 0n],
      [-48n, 18n, 6n],
      [48n, -18n, 6n],
      [-48n, -18n, 6n],
      [1n, 1n, 1n],
      [2n ** 100n, 2n ** 80n, 2n ** 80n],
      [9007199254740993n, 3n, 3n],
      [123456789012345678901234567890n, 9876543210n, 90n],
    ]

    for (const [a, b, expected] of tests) {
      assert.strictEqual(gcd(a, b), expected)
      assert.strictEqual(gcd(b, a), expected)
    }
  })
})
