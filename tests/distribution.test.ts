import assert from 'node:assert'
import seedrandom from 'seedrandom'
import { describe, it } from 'node:test'
import { ArithmeticRange, Distribution, frac } from '../src'

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

    class SignFlipDistribution extends Distribution {
      constructor(public repeatCounts: number) {
        super()
      }

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
          assert.deepStrictEqual(
            new ArithmeticRange(
              signFlipEncoded.denAbs,
              signFlipEncoded.lowAbs,
              signFlipEncoded.highAbs,
            ),
            encoded,
          )
        }
      })
    })

    describe('decode', () => {
      const distribution = new MyDistribution(3)
      const signFlipDistribution = new SignFlipDistribution(3)

      it('Invalid values', () => {
        assert.throws(() => {
          distribution.decode(frac(0, 0))
        })
        assert.throws(() => {
          signFlipDistribution.decode(frac(0, 0))
        })
      })
    })
  })
})
