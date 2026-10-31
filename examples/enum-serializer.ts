import assert from 'node:assert'
import { BASE94_CODER, Distribution, Protocol, EnumSerializer, frac } from '../src'

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

class FoodSerializer extends EnumSerializer<Food> {
  constructor(distribution: FoodDistribution) {
    super(distribution)
  }

  protected override getBase() {
    return {} as Food
  }

  protected override list() {
    const kind = this.enum('kind', kinds)
    switch (kind) {
      case 'vegetable':
        this.enum('name', vegetables)
        break
      case 'fast-food':
        this.enum('name', fastFoods)
        break
      case 'fruit':
        this.enum('name', fruits)
        break
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
