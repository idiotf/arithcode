export function isPowerOfTwo(positiveInt: bigint) {
  return !(positiveInt & (positiveInt - 1n))
}

export function gcd(a: bigint, b: bigint) {
  if (a < 0) a = -a
  if (b < 0) b = -b
  if (a < b) [a, b] = [b, a]

  while (b) [a, b] = [b, a % b]
  return a
}
