import assert from 'node:assert'
import { describe, it } from 'node:test'
import { ceilFraction, gcd } from '../src/utils'

describe('utils.ts', () => {
  it('gcd', () => {
    const tests: [a: bigint, b: bigint, expected: bigint][] = [
      [48n, 18n, 6n],
      [7n, 13n, 1n],
      [100n, 25n, 25n],
      [0n, 12n, 12n],
      [12n, 0n, 12n],
      [0n, 0n, 0n],
      [1n, 1n, 1n],
      [2n ** 100n, 2n ** 80n, 2n ** 80n],
      [9007199254740993n, 3n, 3n],
      [123456789012345678901234567890n, 9876543210n, 90n],
    ]

    function testGcd(a: bigint, b: bigint, expected: bigint) {
      const actual = gcd(a, b)
      assert.strictEqual(
        actual,
        expected,
        `gcd(${a}, ${b}): expected ${expected}, received ${actual}`,
      )
    }

    for (const [a, b, expected] of tests) {
      testGcd(a, b, expected)
      testGcd(b, a, expected)
      testGcd(-a, b, expected)
      testGcd(-b, a, expected)
      testGcd(a, -b, expected)
      testGcd(b, -a, expected)
      testGcd(-a, -b, expected)
      testGcd(-b, -a, expected)
    }
  })

  it('ceilFraction', () => {
    const tests: [a: bigint, b: bigint, expected: bigint][] = [
      [48n, 16n, 3n],
      [48n, 18n, 3n],
      [7n, 13n, 1n],
      [100n, 25n, 4n],
      [215n, 3n, 72n],
      [0n, 12n, 0n],
      [1n, 1n, 1n],
      [1024n, 256n, 4n],
      [1023n, 256n, 4n],
      [1025n, 256n, 5n],
      [2n ** 100n, 2n ** 80n, 2n ** 20n],
      [2n ** 100n - 1n, 2n ** 80n, 2n ** 20n],
      [2n ** 100n + 1n, 2n ** 80n, 2n ** 20n + 1n],
      [-48n, 16n, -3n],
      [-48n, 18n, -2n],
      [-7n, 13n, 0n],
      [-100n, 25n, -4n],
      [-215n, 3n, -71n],
      [-0n, 12n, 0n],
      [-1n, 1n, -1n],
      [-1024n, 256n, -4n],
      [-1023n, 256n, -3n],
      [-1025n, 256n, -4n],
      [-(2n ** 100n), 2n ** 80n, -(2n ** 20n)],
      [-(2n ** 100n) + 1n, 2n ** 80n, -(2n ** 20n) + 1n],
      [-(2n ** 100n) - 1n, 2n ** 80n, -(2n ** 20n)],
    ]

    function testCeilFraction(a: bigint, b: bigint, expected: bigint) {
      const actual = ceilFraction(a, b)
      assert.strictEqual(
        actual,
        expected,
        `ceil(${a}/${b}): expected ${expected}, received ${actual}`,
      )
    }

    for (const [a, b, expected] of tests) {
      testCeilFraction(a, b, expected)
      testCeilFraction(-a, -b, expected)
    }
  })
})
