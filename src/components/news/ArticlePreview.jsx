import { Badge } from 'react-bootstrap'
import { mediaUrl } from '../../utils/mediaUrl'
import SafeHtml from './SafeHtml'

// An article laid out like a public article page: category, title, byline, summary, thumbnail, content (sanitized
// by SafeHtml), images and tags.
export default function ArticlePreview({ article }) {
  return (
    <article className="bg-white border rounded p-4">
      <div className="text-uppercase text-primary small fw-semibold mb-2">{article.category.name}</div>
      <h1 className="h2 mb-2">{article.title}</h1>
      <p className="text-muted small mb-3">
        By {article.authorName || 'Unknown author'}
        {article.publishedAt && <> &middot; Published {new Date(article.publishedAt).toLocaleString()}</>}
      </p>
      {article.summary && <p className="lead">{article.summary}</p>}
      {article.thumbnail && <img src={mediaUrl(article.thumbnail)} alt="" className="img-fluid rounded mb-3" />}
      <SafeHtml html={article.content} />
      {article.images.length > 0 && (
        <div className="mt-4">
          {article.images.map((image) => (
            <figure key={image.id} className="mb-3">
              <img src={mediaUrl(image.url)} alt={image.caption ?? ''} className="img-fluid rounded" />
              {image.caption && <figcaption className="text-muted small">{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {article.tags.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-3">
          {article.tags.map((tag) => (
            <Badge key={tag.id} bg="light" text="dark" className="border">
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}
    </article>
  )
}
