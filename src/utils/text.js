// The text of an HTML string (no tags). DOMParser does not run scripts or load images.
export function plainText(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

// A short text for the meta description. Cuts by code points, so a Khmer character is never split in half.
export function excerpt(text, max = 160) {
  const characters = Array.from(text ?? '')
  return characters.length <= max ? characters.join('') : `${characters.slice(0, max - 1).join('').trimEnd()}…`
}

// An email with most of its name hidden: jonathan@example.com -> jo••••••@example.com
export function maskEmail(email) {
  const [name, domain] = String(email ?? '').split('@')
  if (!domain) return email ?? ''
  const characters = Array.from(name)
  const shown = characters.slice(0, Math.min(2, Math.max(characters.length - 1, 1))).join('')
  return `${shown}${'•'.repeat(Math.max(characters.length - shown.length, 3))}@${domain}`
}
