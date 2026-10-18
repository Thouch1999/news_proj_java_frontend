// A round top for a value axis: four equal steps, each a whole number (1, 2, 3, 4, 5, 10 ... or 25 at the larger sizes)
export function niceMax(value) {
  if (value <= 4) return 4
  const raw = value / 4
  const power = 10 ** Math.floor(Math.log10(raw))
  const candidates = [1, 2, 2.5, 3, 4, 5, 10].filter((candidate) => Number.isInteger(candidate * power))
  return candidates.find((candidate) => candidate * power >= raw) * power * 4
}
