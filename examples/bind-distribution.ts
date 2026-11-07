import assert from 'assert'
import { BASE94_CODER, DistributionSerializer, Protocol, frac } from 'arithcode'

class VarUintDistribution extends DistributionSerializer<number> {
  breakingUnit = frac(8, 99)

  override serialize(input: number) {
    const arr = Array<number>(input + 1).fill(1)
    arr[input] = 0
    return arr
  }

  protected override distribution() {
    let int = 0
    for (;;) {
      const v = this.range([this.breakingUnit])
      if (!v) break
      ++int
    }
    return int
  }
}

interface Position {
  x: number
  y: number
}

class PositionDistribution extends DistributionSerializer<Position> {
  protected varUint = new VarUintDistribution()

  protected override serialize(input: Position): number[] {
    return [
      ...this.varUint.serialize(input.x),
      ...this.varUint.serialize(input.y),
    ]
  }

  protected override distribution(): Position {
    return {
      x: this.varUint.bind(this),
      y: this.varUint.bind(this),
    }
  }
}

const distribution = new PositionDistribution()
const coder = BASE94_CODER
const protocol = new Protocol(distribution, coder)

function gaussianRandom(): Position {
  const r = Math.sqrt(-2 * Math.log(1 - Math.random()))
  const theta = 2 * Math.PI * Math.random()

  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
  }
}

const posFloat = gaussianRandom()
const pos = {
  x: Math.floor(Math.abs(posFloat.x) * 500),
  y: Math.floor(Math.abs(posFloat.y) * 500),
}
console.log(`Position: (${pos.x}, ${pos.y})`)

const encoded = protocol.encode(pos)
console.log(`Encoded: ${encoded}`)

const decoded = protocol.decode(encoded)
assert.deepStrictEqual(decoded, pos)
