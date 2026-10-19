import assert from 'assert'
import { ArithmeticValue, type ArithmeticRange } from './values'

export abstract class StringCoder {
  abstract encode(range: ArithmeticRange): string
  abstract decode(code: string): ArithmeticValue
}

export abstract class DigitCoder extends StringCoder {
  protected abstract charMap: string

  override encode(range: ArithmeticRange): string {
    const charMap = this.charMap
    const digits = BigInt(charMap.length)

    let code = ''
    let { low, high, den } = range

    function ceilFraction(num: bigint, den: bigint) {
      return (num > 0n && den > 0n) || (num < 0n && den < 0n)
        ? num / den + 1n
        : num / den
    }

    for (;;) {
      console.log(`${low} ~ ${high} / ${den}`)
      const lowCeil = ceilFraction(low * digits * 2n - den, den * 2n)
      let highCeil = ceilFraction(high * digits * 2n - den * 3n, den * 2n)
      console.log(lowCeil, highCeil)

      assert(
        0n <= lowCeil && lowCeil < digits,
        `0 <= ${lowCeil} (lowCeil) < ${digits} (digits)`,
      )
      assert(
        0n <= highCeil && highCeil < digits,
        `0 <= ${highCeil} (highCeil) < ${digits} (digits)`,
      )

      code += charMap[Number(highCeil)]!
      if (lowCeil <= highCeil) break

      low = low * digits - highCeil * den
      high = high * digits - highCeil * den
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
