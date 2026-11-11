import assert from 'node:assert'
import seedrandom from 'seedrandom'
import { describe, it } from 'node:test'
import {
  Distribution,
  DistributionSerializerPeer,
  ArithmeticRange,
  frac,
  type Fraction,
} from '../src'

describe('distribution.ts', () => {
  describe('DistributionSerializerPeer', () => {
    describe('encode', () => {
      it('Call encode() in distribution() method', () => {
        class MyDistribution extends Distribution {
          isBinded = false

          protected override distribution() {
            if (this.isBinded) {
              this.range([])
              return
            }
            this.isBinded = true
            this.encode([0])
            assert.doesNotThrow(() => {
              this.range([0.5])
            })
          }
        }

        const distribution = new MyDistribution()
        distribution.encode([1])
      })

      it('Cannot call this.range in input.length getter', () => {
        class MyDistribution extends Distribution {
          protected override distribution() {}
        }

        const distribution = new MyDistribution()

        let getterCalled = false,
          getterSuccess = false
        assert.throws(() => {
          distribution.encode(
            new Proxy([0], {
              get(target, p, receiver) {
                if (p === 'length') {
                  getterCalled = true
                  distribution['range']([])
                  getterSuccess = true
                  return 0
                }

                return Reflect.get(target, p, receiver)
              },
            }),
          )
        })

        assert.ok(getterCalled)
        assert.ok(!getterSuccess)
      })

      it('Call encode() when bind() was called', () => {
        class A extends Distribution {
          b = new B()

          protected override range(): never {
            assert.ok(false)
          }

          protected override distribution() {
            this.b.bind(this)
          }
        }

        class B extends Distribution {
          isBinded = false

          protected override distribution() {
            if (this.isBinded) {
              this.range([0.5])
              return
            }
            this.isBinded = true
            assert.deepStrictEqual(
              this.encode([1]),
              new ArithmeticRange(2n, 1n, 2n),
            )
          }
        }

        const distribution = new A()
        distribution.encode([])
      })
    })

    describe('decode', () => {
      it('Call decode() in distribution() method', () => {
        class MyDistribution extends Distribution {
          isBinded = false

          protected override distribution() {
            if (this.isBinded) {
              this.range([])
              return
            }
            this.isBinded = true
            this.decode(frac(1, 2))
            assert.doesNotThrow(() => {
              this.range([0.5])
            })
          }
        }

        const distribution = new MyDistribution()
        distribution.decode(frac(1, 2))
      })

      it('Cannot call this.range in deserialize() method', () => {
        class MyDistribution extends DistributionSerializerPeer<number[]> {
          protected override serialize(input: number[]) {
            return input
          }

          protected override deserialize(serialized: number[]) {
            this.range([])
            return serialized
          }

          protected override distribution() {}
        }

        const distribution = new MyDistribution()
        assert.throws(() => {
          distribution.decode(frac(1, 2))
        })
      })

      it('Call decode() when bind() was called', () => {
        class A extends Distribution {
          b = new B()

          protected override range(): never {
            assert.ok(false)
          }

          protected override distribution() {
            this.b.bind(this)
          }
        }

        class B extends Distribution {
          isBinded = false

          protected override distribution() {
            if (this.isBinded) {
              this.range([0.5])
              return
            }
            this.isBinded = true
            assert.deepStrictEqual(this.decode(frac(3, 4)), [1])
          }
        }

        const distribution = new A()
        assert.deepStrictEqual(distribution.decode(frac(1, 2)), [])
      })
    })

    describe('bind', () => {
      it('Bind recursive', () => {
        class A extends Distribution {
          isBinded = false
          private rangeCallCnt = 0

          protected override range<
            const T extends readonly (number | Fraction)[],
          >(range: T) {
            assert.ok(++this.rangeCallCnt < 2)
            return super.range(range)
          }

          protected override distribution() {
            if (this.isBinded) {
              this.range([])
            } else {
              this.isBinded = true
              this.bind(this)
            }
          }
        }

        const distribution = new A()
        distribution.encode([0])
      })

      it('Bind circular', () => {
        class A extends Distribution {
          isBinded = false
          b = new B(this)

          protected override distribution() {
            if (this.isBinded) {
              this.range([])
            } else {
              this.isBinded = true
              this.b.bind(this)
            }
          }
        }

        class B extends Distribution {
          private rangeCallCnt = 0

          constructor(public a: A) {
            super()
          }

          protected override range<
            const T extends readonly (number | Fraction)[],
          >(range: T) {
            assert.ok(++this.rangeCallCnt < 2)
            return super.range(range)
          }

          protected override distribution() {
            this.range([])
            this.a.bind(this)
          }
        }

        const distribution = new A()
        distribution.encode([0, 0])
      })

      it('Encode & bind reversed circular', () => {
        class A extends Distribution {
          isBinded = false
          b = new B(this)
          c = this.b.c

          protected override distribution() {
            if (this.isBinded) {
              this.b.bind(this.c)
              return
            }
            this.isBinded = true
            assert.deepStrictEqual(
              this.b.encode([2]),
              new ArithmeticRange(4n, 3n, 4n),
            )
            this.range([0.5, 0.75, 0.75])
          }
        }

        class B extends Distribution {
          isBinded = false
          c: C

          constructor(public a: A) {
            super()
            this.c = new C(this)
          }

          protected override distribution() {
            if (this.isBinded) {
              this.c.bind(this.a)
              return
            }
            this.isBinded = true
            assert.deepStrictEqual(
              this.c.encode([1]),
              new ArithmeticRange(2n, 1n, 2n),
            )
            this.range([0.5, 0.75, 1])
          }
        }

        class C extends Distribution {
          isBinded = false
          isCircularBinded = false
          rangeCallCnt = 0
          a: A

          constructor(public b: B) {
            super()
            this.a = b.a
          }

          protected override range<
            const T extends readonly (number | Fraction)[],
          >(range: T) {
            assert.ok(++this.rangeCallCnt < 2)
            return super.range(range)
          }

          protected override distribution() {
            if (this.isBinded) {
              if (this.isCircularBinded) {
                return
              }
              this.isCircularBinded = true
              this.range([0.5])
              return
            }
            this.isBinded = true
            this.a.bind(this.b)
          }
        }

        const distribution = new A()
        distribution.encode([3])
      })
    })
  })

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
