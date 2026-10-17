import DOMPurify from 'dompurify'

// Shows article content (HTML written in the editor) after DOMPurify has removed anything unsafe.
export default function SafeHtml({ html }) {
  return <div className="article-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html ?? '') }} />
}
