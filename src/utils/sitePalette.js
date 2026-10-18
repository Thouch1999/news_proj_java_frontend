import { contrast, ensureContrast, onColor, parseHex, rgbTriplet, shade } from './color'

// The site colours (settings primary_color and accent_color) as CSS variables on <html>, for the light and the dark mode.
// A colour that is still the built-in default sets nothing: the stylesheet's own, hand-tuned values stay (see _theme.scss).
// A custom colour sets variables whose text colours are always readable (WCAG AA, 4.5:1): the colour is made lighter or
// darker where it is used as text, and the text on it is white or near-black, whichever reads better.

export const DEFAULT_PRIMARY = '#27306D'
export const DEFAULT_ACCENT = '#DA0000'

const SURFACE = { light: '#FFFFFF', dark: '#252B3B' } // a card
const GRAY = '#F1F1F1' // the light gray bars of the public site
const PAGE_DARK = '#1D222E'

const same = (a, b) => String(a).toUpperCase() === String(b).toUpperCase()

// { variables: { '--site-...': value }, primary: bool, accent: bool, headerText: '#FFFFFF' | '#111827' }
export function sitePalette(primaryColor, accentColor, theme) {
  const surface = SURFACE[theme] ?? SURFACE.light
  const dark = theme === 'dark'
  const customPrimary = Boolean(parseHex(primaryColor)) && !same(primaryColor, DEFAULT_PRIMARY)
  const customAccent = Boolean(parseHex(accentColor)) && !same(accentColor, DEFAULT_ACCENT)
  const variables = {}
  const primary = customPrimary ? primaryColor.toUpperCase() : DEFAULT_PRIMARY
  const accent = customAccent ? accentColor.toUpperCase() : DEFAULT_ACCENT

  // as text on a card (and on the light gray bars in the light mode)
  const asText = (color) => {
    const onSurface = ensureContrast(color, surface, 4.5)
    return dark ? onSurface : ensureContrast(onSurface, GRAY, 4.5)
  }

  if (customPrimary) {
    const text = asText(primary)
    const button = dark ? ensureContrast(primary, PAGE_DARK, 3) : primary // a button must stand out from the page
    Object.assign(variables, {
      '--site-primary': primary,
      '--site-on-primary': onColor(primary),
      '--site-primary-text': text,
      '--site-primary-text-rgb': rgbTriplet(text),
      '--site-header-hover': ensureContrast('#61A4BC', primary, 3), // the blue of a hovered menu item, moved until it reads on the header
      '--site-btn-bg': button,
      '--site-btn-hover': shade(button, contrast('#FFFFFF', button) >= 4.5 ? 0.12 : -0.12),
      '--site-btn-active': shade(button, contrast('#FFFFFF', button) >= 4.5 ? 0.2 : -0.2),
      '--site-on-btn': onColor(button),
      '--bs-primary': text,
      '--bs-primary-rgb': rgbTriplet(text),
      '--bs-link-color': text,
      '--bs-link-color-rgb': rgbTriplet(text),
      '--bs-link-hover-color': shade(text, dark ? -0.2 : 0.2),
      '--bs-link-hover-color-rgb': rgbTriplet(shade(text, dark ? -0.2 : 0.2)),
    })
  }
  if (customAccent) {
    Object.assign(variables, {
      '--site-accent': accent,
      '--site-on-accent': onColor(accent),
      '--site-accent-text': asText(accent),
      '--site-accent-on-white': ensureContrast(accent, '#FFFFFF', 4.5), // the red search icon on the white box
    })
  }
  if (customPrimary || customAccent) {
    // the site name on the header (the primary colour): the accent, moved until it reads on it (3:1, it is large text)
    variables['--site-brand'] = ensureContrast(accent, primary, 3)
  }
  return { variables, primary: customPrimary, accent: customAccent, headerText: onColor(primary) }
}

const applied = new Set()

// Puts the palette on <html>: the variables and the attributes the stylesheet checks (data-site-primary, data-site-accent).
export function applySitePalette(palette) {
  const root = document.documentElement
  applied.forEach((name) => root.style.removeProperty(name))
  applied.clear()
  Object.entries(palette.variables).forEach(([name, value]) => {
    root.style.setProperty(name, value)
    applied.add(name)
  })
  root.toggleAttribute('data-site-primary', palette.primary)
  root.toggleAttribute('data-site-accent', palette.accent)
}
