import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Distribution, Base94Coder, Protocol, frac } from '../src'

describe('protocol.ts', () => {
  it('Protocol', () => {
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
    const coder = new Base94Coder()
    const protocol = new Protocol(distribution, coder)

    const tests: number[][] = [
      [0],
      [1, 2],
      [2, 1, 3],
      [3, 2, 0, 1],
      [4, 2, 1, 0, 2],
    ]

    for (const input of tests) {
      assert.deepStrictEqual(protocol.decode(protocol.encode(input)), input)
    }
  })
})
