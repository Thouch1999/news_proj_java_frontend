import DOMPurify from 'dompurify'

// Text pasted from Word or a web page brings its own colours and backgrounds (often white), which look wrong in the dark
// mode: the colour and background parts of inline styles and the old colour attributes are removed. Everything else
// (alignment, sizes) stays, and a link that opens a new tab gets rel="noopener noreferrer".
const COLOUR_STYLE = /^\s*(color|background(-[a-z-]+)?)\s*:/i

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute?.('style')) {
    const kept = node
      .getAttribute('style')
      .split(';')
      .filter((rule) => rule.trim() && !COLOUR_STYLE.test(rule))
      .join(';')
    if (kept) node.setAttribute('style', kept)
    else node.removeAttribute('style')
  }
  node.removeAttribute?.('bgcolor')
  node.removeAttribute?.('color')
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer')
})

// Shows article content (HTML written in the editor) after DOMPurify has removed anything unsafe.
export default function SafeHtml({ html }) {
  return <div className="article-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['target'] }) }} />
}
