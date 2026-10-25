import assert from 'assert'
import { Distribution, BASE94_CODER, Protocol, frac } from '../src'

class MyDistribution extends Distribution {
  protected override distribution() {
    this.range([frac(1, 3), frac(2, 3)])
    this.range([frac(1, 3), frac(2, 3)])
    this.range([frac(1, 3), frac(2, 3)])
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
