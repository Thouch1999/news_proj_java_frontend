// Passwords: a random one and a rough strength. The backend only asks for 8 characters or more (the strength is advice).

const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%^&*-_+=?'
const SETS = [LOWER, UPPER, DIGITS, SYMBOLS] // letters that look alike (l, 1, O, 0) are left out

export const PASSWORD_MIN = 8

// a whole number below `max` from crypto.getRandomValues, without a bias towards the small numbers
function randomBelow(max) {
  const limit = Math.floor(0x100000000 / max) * max
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % max
}

// A random password with at least one lower-case letter, upper-case letter, digit and symbol
export function generatePassword(length = 14) {
  const all = SETS.join('')
  const characters = SETS.map((set) => set[randomBelow(set.length)])
  while (characters.length < length) characters.push(all[randomBelow(all.length)])
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const other = randomBelow(index + 1)
    ;[characters[index], characters[other]] = [characters[other], characters[index]]
  }
  return characters.join('')
}

// 0 nothing typed, 1 weak (shorter than the minimum), 2 fair, 3 good, 4 strong
export function passwordStrength(value) {
  if (!value) return 0
  if (value.length < PASSWORD_MIN) return 1
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length
  return Math.min(4, 2 + (value.length >= 12 ? 1 : 0) + (kinds >= 3 ? 1 : 0))
}
