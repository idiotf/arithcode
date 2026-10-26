import seedrandom from 'seedrandom'
import {
  Distribution,
  BASE94_CODER,
  Protocol,
  Fraction,
  ArithmeticRange,
  frac,
} from '../src'

const random = seedrandom('arithcode performance test seed')

function compareFraction(a: Fraction, b: Fraction) {
  return a.isLessThan(b) ? -1 : a.isGreaterThan(b) ? 1 : 0
}

function fibonacci(n: number) {
  let prev = 1n
  let current = 0n

  for (let i = 0; i < n; ++i) {
    ;[prev, current] = [current, prev + current]
  }

  return current
}

let label

{
  const RANGE_LENGTH = 5
  const INPUT_LENGTH = 100
  const REPEAT_COUNT = 1000

  class MyDistribution extends Distribution {
    private static staticRange = Array.from({ length: RANGE_LENGTH - 1 }, () =>
      frac(random()),
    ).sort(compareFraction)

    protected override distribution() {
      for (let i = 0; i < INPUT_LENGTH; ++i) {
        this.range(MyDistribution.staticRange)
      }
    }
  }

  const distribution = new MyDistribution()
  const data = Array.from({ length: INPUT_LENGTH }, () =>
    Math.floor(random() * RANGE_LENGTH),
  )

  console.time((label = 'Distribution.encode(): random float-point range'))
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    distribution.encode(data)
  }
  console.timeEnd(label)

  const coder = BASE94_CODER
  const protocol = new Protocol(distribution, coder)
  const code = protocol.encode(data)
  const value = coder.decode(code)

  console.time((label = 'Distribution.decode(): random float-point range'))
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    distribution.decode(value)
  }
  console.timeEnd(label)
}

{
  const RANGE_LENGTH = 5
  const INPUT_LENGTH = 100
  const REPEAT_COUNT = 1000
  const MAX_DENOMINATOR = 1_000_000_000

  class MyDistribution extends Distribution {
    private static staticRange = Array.from(
      { length: RANGE_LENGTH - 1 },
      () => {
        const den = Math.floor(random() * MAX_DENOMINATOR + 1)
        return frac(Math.floor(random() * den + 1), den)
      },
    ).sort(compareFraction)

    protected override distribution() {
      for (let i = 0; i < INPUT_LENGTH; ++i) {
        this.range(MyDistribution.staticRange)
      }
    }
  }

  const distribution = new MyDistribution()
  const data = Array.from({ length: INPUT_LENGTH }, () =>
    Math.floor(random() * RANGE_LENGTH),
  )

  console.time((label = 'Distribution.encode(): random fraction range'))
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    distribution.encode(data)
  }
  console.timeEnd(label)

  const coder = BASE94_CODER
  const protocol = new Protocol(distribution, coder)
  const code = protocol.encode(data)
  const value = coder.decode(code)

  console.time((label = 'Distribution.decode(): random fraction range'))
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    distribution.decode(value)
  }
  console.timeEnd(label)
}

{
  const REPEAT_COUNT = 10000

  const coder = BASE94_CODER
  const ENCODING_INPUT = new ArithmeticRange(
    fibonacci(1000),
    fibonacci(997),
    fibonacci(997) + 1n,
  )
  const DECODING_INPUT = coder.encode(ENCODING_INPUT)

  console.time('Base94Coder.encode()')
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    coder.encode(ENCODING_INPUT)
  }
  console.timeEnd('Base94Coder.encode()')

  console.time('Base94Coder.decode()')
  for (let i = 0; i < REPEAT_COUNT; ++i) {
    coder.decode(DECODING_INPUT)
  }
  console.timeEnd('Base94Coder.decode()')
}
