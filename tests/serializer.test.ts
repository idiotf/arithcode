import assert from 'node:assert'
import { describe, it } from 'node:test'
import { EnumSerializer } from '../src'

describe('serializer.ts', () => {
  describe('EnumSerializer', () => {
    type TestData = TestData1 | TestData2

    interface TestData1 {
      foo: 'bar'
      bar: 1 | 2
    }

    const symbol = Symbol()

    interface TestData2 {
      foo: 'baz'
      [symbol]: 'a' | 'b'
    }

    class MyEnumSerializer extends EnumSerializer<TestData> {
      protected override getBase() {
        return {} as TestData
      }

      protected override list() {
        const foo = this.enum('foo', ['bar', 'baz'])
        if (foo === 'bar') {
          
        }
      }
    }

    describe('encode', () => {
      
    })
  })
})
