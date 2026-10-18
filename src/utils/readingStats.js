import { plainText } from './text'

const WORDS_PER_MINUTE = 200

// Words and reading time of an article's HTML. Khmer is written without spaces between words, so the words are found
// with Intl.Segmenter (it knows Khmer); without it the text is split at spaces.
// -> { words, minutes } (minutes is at least 1 when there is any text)
export function readingStats(html, language = 'en') {
  const text = plainText(html)
  if (!text) return { words: 0, minutes: 0 }
  let words
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    words = 0
    for (const part of new Intl.Segmenter(language, { granularity: 'word' }).segment(text)) {
      if (part.isWordLike) words += 1
    }
  } else {
    words = text.split(/\s+/).filter(Boolean).length
  }
  return { words, minutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) }
}
