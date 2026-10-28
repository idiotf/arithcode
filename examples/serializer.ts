import assert from 'assert'
import { BASE94_CODER, Distribution, Protocol, Serializer, frac } from '../src'

const kinds = [
  'vegetable',
  'fast-food',
  'fruit',
] as const satisfies Food['kind'][]

const vegetables = ['potato', 'carrot', 'onion'] as const
const fastFoods = ['pizza', 'hamburger', 'fried-chicken'] as const
const fruits = ['apple', 'banana', 'orange', 'strawberry'] as const

type Food = Vegetable | FastFood | Fruit

interface Vegetable {
  kind: 'vegetable'
  name: (typeof vegetables)[number]
}

interface FastFood {
  kind: 'fast-food'
  name: (typeof fastFoods)[number]
}

interface Fruit {
  kind: 'fruit'
  name: (typeof fruits)[number]
}

class FoodSerializer extends Serializer<Food> {
  constructor(distribution: FoodDistribution) {
    super(distribution)
  }

  protected override serialize(input: Food) {
    switch (input.kind) {
      case 'vegetable':
        return [0, vegetables.indexOf(input.name)]
      case 'fast-food':
        return [1, fastFoods.indexOf(input.name)]
      case 'fruit':
        return [2, fruits.indexOf(input.name)]
    }
  }

  protected override deserialize(serialized: number[]): Food {
    switch (serialized[0]) {
      case 0:
        return { kind: 'vegetable', name: vegetables[serialized[1]!]! }
      case 1:
        return { kind: 'fast-food', name: fastFoods[serialized[1]!]! }
      case 2:
        return { kind: 'fruit', name: fruits[serialized[1]!]! }
      default:
        throw TypeError(`Unrecognized food kind: ${serialized[0]}`)
    }
  }
}

class FoodDistribution extends Distribution {
  protected override distribution() {
    const kind = this.range([
      // Vegetables
      frac(1, 5),
      // Fast foods
      frac(2, 3),
      // Fruits
    ])

    switch (kind) {
      case 0: // Vegetables
        this.range([
          // Potato
          frac(1, 3),
          // Carrot
          frac(3, 4),
          // Onion
        ])
        break
      case 1: // Fast foods
        this.range([
          // Pizza
          frac(2, 5),
          // Hamburger
          frac(5, 8),
          // Fried chicken
        ])
        break
      case 2: // Fruits
        this.range([
          // Apple
          frac(2, 5),
          // Banana
          frac(8, 17),
          // Orange
          frac(7, 9),
          // Strawberry
        ])
    }
  }
}

const distribution = new FoodDistribution()
const serializer = new FoodSerializer(distribution)
const coder = BASE94_CODER
const protocol = new Protocol(serializer, coder)

function pickRandom<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function pickFood(): Food {
  const kind = pickRandom(kinds)

  switch (kind) {
    case 'vegetable':
      return { kind, name: pickRandom(vegetables) }
    case 'fast-food':
      return { kind, name: pickRandom(fastFoods) }
    case 'fruit':
      return { kind, name: pickRandom(fruits) }
  }
}

const food = pickFood()
console.log(`My food: ${food.name} (${food.kind})`)

const encoded = protocol.encode(food)
console.log(`Encoded: ${encoded}`)

const decoded = protocol.decode(encoded)
assert.deepStrictEqual(decoded, food)
