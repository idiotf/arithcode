import { Distribution, frac } from '../src'

class ErrorInfoDistribution extends Distribution {
  private env() {
    const os = this.range([
      // Windows
      frac(8, 25),
      // Android
      frac(16, 25),
      // iOS
      frac(20, 25),
      // macOS
      frac(22, 25),
      // Linux
      frac(24, 25),
      // (unknown)
    ])

    switch (os) {
      case 0: {
        // Windows
        const major = this.range([
          // 10
          frac(49, 100),
          // 11+
          frac(99, 100),
          // (unknown)
        ])
        if (major === 2) {
          this.vint()
        }

        const browser = this.range([
          // Chrome
          frac(70, 100),
          // Edge
          frac(85, 100),
          // Naver Whale
          frac(90, 100),
          // Firefox
          frac(95, 100),
          // Opera
          frac(98, 100),
          // (unknown)
        ])
        this.vint() // Browser major

        return { os, browser }
      }

      case 1: {
        // Android
        this.vint() // Major version

        const browser = this.range([
          // Chrome
          frac(50, 100),
          // Samsung Internet
          frac(85, 100),
          // Edge
          frac(95, 100),
          // Firefox
          frac(99, 100),
          // (unknown)
        ])
        this.vint() // Browser major

        return { os, browser }
      }

      case 2: {

      }

      case 5: {
        // (unknown)
        this.vascii()
        this.vint()
        break
      }

      default: {
        this.vint()
        break
      }
    }
  }

  protected override distribution() {
    const { os, browser } = this.env()
  }
}
