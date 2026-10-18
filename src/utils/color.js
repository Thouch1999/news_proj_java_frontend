// Colour maths for the site colours (primary and accent): contrast ratios (WCAG) and the text colours derived from them.

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function parseHex(hex) {
  if (typeof hex !== 'string' || !HEX_COLOR.test(hex)) return null
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
}

export function toHex([red, green, blue]) {
  return `#${[red, green, blue].map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function luminance(hex) {
  const [red, green, blue] = parseHex(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

// WCAG contrast ratio of two colours, 1 to 21
export function contrast(first, second) {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function rgbToHsl([red, green, blue]) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  if (max === min) return [0, 0, lightness]
  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  return [hue / 6, saturation, lightness]
}

function hslToRgb([hue, saturation, lightness]) {
  if (saturation === 0) return [lightness * 255, lightness * 255, lightness * 255]
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q
  const channel = (offset) => {
    let t = hue + offset
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [channel(1 / 3) * 255, channel(0) * 255, channel(-1 / 3) * 255]
}

// The same colour made lighter or darker, in steps of 1% lightness, until it has `minimum` contrast on `background`. Both
// directions are tried and the one that needs the smaller change wins (a mid-tone background can be reached only one way);
// when neither reaches it, the one with the best contrast (black or white at the end). The colour itself when it already does.
export function ensureContrast(hex, background, minimum) {
  if (contrast(hex, background) >= minimum) return hex
  const [hue, saturation, lightness] = rgbToHsl(parseHex(hex))
  let best = null
  for (const direction of [1, -1]) {
    let candidate = hex
    for (let step = 1; step <= 100; step += 1) {
      const next = lightness + direction * step * 0.01
      if (next < 0 || next > 1) break
      candidate = toHex(hslToRgb([hue, saturation, next]))
      if (contrast(candidate, background) >= minimum) break
    }
    const reached = contrast(candidate, background)
    const change = Math.abs(rgbToHsl(parseHex(candidate))[2] - lightness)
    const meets = reached >= minimum
    const better = !best || (meets && (!best.meets || change < best.change)) || (!meets && !best.meets && reached > best.reached)
    if (better) best = { candidate, reached, change, meets }
  }
  return best.candidate
}

// White or near-black text, whichever reads better on this colour
export function onColor(hex) {
  return contrast('#FFFFFF', hex) >= contrast('#111827', hex) ? '#FFFFFF' : '#111827'
}

// The colour a little darker (positive amount, 0 to 1) or lighter (negative), for hover states
export function shade(hex, amount) {
  const target = amount >= 0 ? [0, 0, 0] : [255, 255, 255]
  const weight = Math.abs(amount)
  return toHex(parseHex(hex).map((value, index) => value * (1 - weight) + target[index] * weight))
}

export function rgbTriplet(hex) {
  return parseHex(hex).join(', ')
}
