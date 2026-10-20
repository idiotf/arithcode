import { ArithmeticValue, type ArithmeticRange } from './values'
import { ceilFraction, gcd } from './utils'

export abstract class StringCoder {
  abstract encode(range: ArithmeticRange): string
  abstract decode(code: string): ArithmeticValue
}

export abstract class DigitCoder extends StringCoder {
  protected abstract charMap: string

  override encode(range: ArithmeticRange): string {
    if (!range.isValid) {
      throw RangeError(`Invalid range input: ${range}`)
    }

    let { lowAbs: low, highAbs: high } = range
    const { denAbs: den } = range

    if (low * 2n <= den && den < high * 2n) {
      return ''
    }

    const charMap = this.charMap
    const digits = BigInt(charMap.length)

    let code = ''

    for (;;) {
      const lowCeil = ceilFraction(low * digits * 2n - den, den * 2n)
      const highCeil = ceilFraction(high * digits * 2n - den * 3n, den * 2n)

      if (
        lowCeil < 0n ||
        digits < lowCeil ||
        highCeil < -1n ||
        digits <= highCeil
      ) {
        throw RangeError(
          `Low or high value is out of range ` +
            `(${lowCeil} ~ ${highCeil} / ${digits}). ` +
            `This is an internal bug in DigitCoder.encode() method.`,
        )
      }

      if (lowCeil <= highCeil) {
        code += charMap[Number(highCeil)]!
        break
      }

      const divGcd = gcd(den, digits)
      const reducedDigits = digits / divGcd
      const reducedDen = den / divGcd

      const lowNum = reducedDigits * low
      const highNum = reducedDigits * high
      const divNum = reducedDen * lowCeil

      const lowDelta = divNum - lowNum
      const highDelta = highNum - divNum
      const preferredCeil = lowDelta <= highDelta ? lowCeil : highCeil
      if (preferredCeil < 0n || digits <= preferredCeil) {
        throw RangeError(
          `preferredCeil is out of range (0 ~ ${digits - 1n} / ${digits}). ` +
            `This is an internal bug in DigitCoder.encode() method.`,
        )
      }

      code += charMap[Number(preferredCeil)]!
      low = low * digits - preferredCeil * den
      high = high * digits - preferredCeil * den

      if (low < 0n) low = 0n
      if (high > den) high = den
    }

    return code
  }

  override decode(code: string) {
    const charMap = this.charMap
    const digits = BigInt(charMap.length)

    let num = 1n
    let den = 2n

    for (const char of code) {
      const charIdx = charMap.indexOf(char)
      if (charIdx === -1) {
        throw TypeError('Invalid char received: ' + char)
      }

      num = (num - 1n) * digits + BigInt(charIdx * 2 + 1)
      den *= digits
    }

    return new ArithmeticValue(num, den)
  }
}

export class Base64Coder extends DigitCoder {
  protected override charMap =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
}

export class Base64UrlCoder extends DigitCoder {
  protected override charMap =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
}

export class Z85Coder extends DigitCoder {
  protected override charMap =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#'
}

export class Base94Coder extends DigitCoder {
  protected override charMap =
    '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
}
