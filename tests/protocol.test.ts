import assert from 'node:assert'
import seedrandom from 'seedrandom'
import { describe, it } from 'node:test'
import { Distribution, Base94Coder, Protocol, frac } from '../src'

describe('protocol.ts', () => {
  describe('Protocol', () => {
    const coder = new Base94Coder()

    it('Hard-coded test cases', () => {
      class MyDistribution extends Distribution {
        protected override distribution() {
          const repeatCount = this.range([
            frac(1, 2),
            frac(3, 4),
            frac(7, 8),
            frac(15, 16),
          ])

          for (let i = 0; i < repeatCount; ++i) {
            this.range([frac(1, 3), frac(1, 2), frac(2, 3)])
          }
        }
      }

      const distribution = new MyDistribution()
      const protocol = new Protocol(distribution, coder)

      const tests: number[][] = [
        [0],
        [1, 2],
        [2, 1, 3],
        [3, 2, 0, 1],
        [4, 2, 1, 0, 2],
      ]

      for (const input of tests) {
        const encoded = protocol.encode(input)
        const decoded = protocol.decode(encoded)
        assert.deepStrictEqual(decoded, input)
      }
    })

    it('Auto-generated test cases', () => {
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

      const random = seedrandom('arithcode test seed')
      const distribution = new MyDistribution(Math.floor(random() * 1234 + 1))
      const protocol = new Protocol(distribution, coder)

      
    })
  })
})
