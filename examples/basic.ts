import assert from 'node:assert'
import {
  Distribution,
  BASE94_CODER,
  Protocol,
  frac,
  type DistributionCtx,
} from 'arithcode'

class MyDistribution extends Distribution {
  protected override distribution(ctx: DistributionCtx) {
    ctx.range([frac(1, 3), frac(2, 3)])
    ctx.range([frac(1, 3), frac(2, 3)])
    ctx.range([frac(1, 3), frac(2, 3)])
  }
}

const distribution = new MyDistribution()
const coder = BASE94_CODER
const protocol = new Protocol(distribution, coder)

const data = [0, 1, 2]
const encoded = protocol.encode(data)
const decoded = protocol.decode(encoded)

console.log('encoded:', encoded)
assert.deepStrictEqual(data, decoded)
