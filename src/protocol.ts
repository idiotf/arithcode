import type { Distribution } from './distribution'
import type { StringCoder } from './string-coder'

export class Protocol {
  constructor(
    public distribution: Distribution,
    public coder: StringCoder,
  ) {}

  encode(data: number[]) {
    return this.coder.encode(this.distribution.encode(data))
  }

  decode(code: string) {
    return this.distribution.decode(this.coder.decode(code))
  }
}
