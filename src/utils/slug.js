// Mirrors the backend SlugUtil.slugify: lower-case ASCII, accents removed, other characters become hyphens.
// Returns '' when the text has no Latin letters or digits (for example a Khmer-only name).
// Used only for the preview; the backend decides the final slug (it also makes it unique).
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
