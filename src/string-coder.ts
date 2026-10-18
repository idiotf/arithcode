import { ArithmeticValue, type ArithmeticRange } from './values'

export abstract class StringCoder {
  abstract encode(range: ArithmeticRange): string
  abstract decode(code: string): ArithmeticValue
}

export abstract class DigitCoder extends StringCoder {
  protected abstract charMap: string

  override encode(range: ArithmeticRange): string {
    console.log(range)
    throw new Error('Method not implemented.')
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
