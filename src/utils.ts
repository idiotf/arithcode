export function isPowerOfTwo(positiveInt: bigint) {
  return !(positiveInt & (positiveInt - 1n))
}

export function gcd(a: bigint, b: bigint) {
  a = abs(a)
  b = abs(b)
  if (a < b) [a, b] = [b, a]

  while (b) [a, b] = [b, a % b]
  return a
}

export function ceilFraction(num: bigint, den: bigint) {
  return ((num > 0n && den > 0n) || (num < 0n && den < 0n)) && num % den
    ? num / den + 1n
    : num / den
}

export function abs(v: bigint) {
  return v < 0n ? -v : v
}
