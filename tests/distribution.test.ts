import assert from 'node:assert'
import seedrandom from 'seedrandom'
import { describe, it } from 'node:test'
import { Distribution, frac } from '../src'

describe('distribution.ts', () => {
  describe('Distribution', () => {
    class MyDistribution extends Distribution {
      constructor(public repeatCounts: number) {
        super()
      }

      protected override distribution() {
        for (let i = 0; i < this.repeatCounts; ++i) {
          this.range([frac(1, 5), frac(2, 5), frac(3, 5), frac(4, 5)])
        }
      }
    }

    class SignFlipDistribution extends MyDistribution {
      protected override distribution() {
        for (let i = 0; i < this.repeatCounts; ++i) {
          this.range([frac(-1, -5), frac(2, 5), frac(-3, -5), frac(4, 5)])
        }
      }
    }

    describe('encode', () => {
      it('Sign flipped', () => {
        const random = seedrandom('Distribution test seed')
        for (let i = 0; i < 100; ++i) {
          const distribution = new MyDistribution(
            Math.floor(random() * 123 + 1),
          )
          const signFlipDistribution = new SignFlipDistribution(
            distribution.repeatCounts,
          )

          const input = Array.from({ length: distribution.repeatCounts }, () =>
            Math.floor(random() * 5),
          )
          const encoded = distribution.encode(input)
          const signFlipEncoded = signFlipDistribution.encode(input)
          assert.deepStrictEqual(signFlipEncoded, encoded)
        }
      })
    })

    describe('decode', () => {
      const distribution = new MyDistribution(3)
      const signFlipDistribution = new SignFlipDistribution(3)

      function testIt(dist: MyDistribution, sign: -1n | 1n = 1n) {
        it('Common', () => {
          const den = 2n * 5n ** BigInt(dist.repeatCounts)
          for (let num = 1n; num < den; num += 2n) {
            const value = frac(num * sign, den * sign)
            const decoded = dist.decode(value)
            assert.deepStrictEqual(
              decoded,
              Array.from({ length: dist.repeatCounts }, (_, i) => {
                const numNorm = (num - 1n) / 2n
                return Number((numNorm / 5n ** BigInt(i)) % 5n)
              }).reverse(),
            )
          }
        })

        it('Edge of distribution range', () => {
          const den = 5n ** BigInt(dist.repeatCounts)
          for (let num = 0n; num < den; ++num) {
            const value = frac(num * sign, den * sign)
            const decoded = dist.decode(value)
            assert.deepStrictEqual(
              decoded,
              Array.from({ length: dist.repeatCounts }, (_, i) =>
                Number((num / 5n ** BigInt(i)) % 5n),
              ).reverse(),
            )
          }
        })

        it('Invalid values', () => {
          const tests = [frac(-1, 2), frac(3, 2), frac(0, 0), frac(1, 0)]

          for (const { num, den } of tests) {
            assert.throws(() => {
              dist.decode(frac(num * sign, den * sign))
            })
          }
        })
      }

      describe('Common distribution', () => {
        describe('Common', () => testIt(distribution))
        describe('Sign flipped', () => testIt(distribution))
      })
      describe('Sign flipped distribution', () => {
        describe('Common', () => testIt(signFlipDistribution))
        describe('Sign flipped', () => testIt(signFlipDistribution))
      })
    })
  })
})
