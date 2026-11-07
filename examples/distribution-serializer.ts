import assert from 'node:assert'
import { BASE94_CODER, DistributionSerializer, Protocol, frac } from 'arithcode'

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

class FoodDistribution extends DistributionSerializer<Food> {
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

  protected override distribution(): Food {
    const kind = this.range([
      // Vegetables
      frac(1, 5),
      // Fast foods
      frac(2, 3),
      // Fruits
    ])

    switch (kind) {
      case 0: {
        // Vegetables
        const idx = this.range([
          // Potato
          frac(1, 3),
          // Carrot
          frac(3, 4),
          // Onion
        ])
        return { kind: 'vegetable', name: vegetables[idx] }
      }
      case 1: {
        // Fast foods
        const idx = this.range([
          // Pizza
          frac(2, 5),
          // Hamburger
          frac(5, 8),
          // Fried chicken
        ])
        return { kind: 'fast-food', name: fastFoods[idx] }
      }
      case 2: {
        // Fruits
        const idx = this.range([
          // Apple
          frac(2, 5),
          // Banana
          frac(8, 17),
          // Orange
          frac(7, 9),
          // Strawberry
        ])
        return { kind: 'fruit', name: fruits[idx] }
      }
    }
  }
}

const distribution = new FoodDistribution()
const coder = BASE94_CODER
const protocol = new Protocol(distribution, coder)

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
