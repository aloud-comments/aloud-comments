export function isBgDark (backgroundColor?: string): boolean | null {
  backgroundColor
    = backgroundColor
    || document.body.style.backgroundColor
    || document.documentElement.style.backgroundColor
    || getComputedStyle(document.documentElement).backgroundColor

  if (!backgroundColor) {
    return null
  }

  let c: {
    r: number;
    g: number;
    b: number;
    a: number;
  } | null = null

  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.substr(1)
    c = {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
      a: parseInt(hex.substr(6, 2), 16) / 255
    }
  } else if (backgroundColor.startsWith('rgb')) {
    const m = backgroundColor
      .replace(/^.+\(/, '')
      .replace(/\).*$/, '')
      .split(/,/g)
    c = {
      r: parseInt(m[0]),
      g: parseInt(m[1]),
      b: parseInt(m[2]),
      a: parseInt(m[3])
    }
  }

  if (isNaN(c.a)) {
    c.a = 1
  }

  return c ? ((c.r * 299 + c.g * 587 + c.b * 114) * c.a) / 1000 <= 155 : false
}
