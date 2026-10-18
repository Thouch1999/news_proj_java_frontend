import { Badge } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useFormat } from '../../hooks/useFormat'
import { mediaUrl } from '../../utils/mediaUrl'
import SafeHtml from './SafeHtml'

// An article laid out like a public article page: category, title, byline, summary, thumbnail, content (sanitized
// by SafeHtml), images and tags.
export default function ArticlePreview({ article }) {
  const { t } = useTranslation()
  const { formatDateTime } = useFormat()
  return (
    <article className="bg-surface border rounded p-4">
      <div className="text-uppercase text-primary small fw-semibold mb-2">{article.category.name}</div>
      <h1 className="h2 mb-2">{article.title}</h1>
      <p className="text-muted small mb-3">
        {t('news.preview.by', { name: article.authorName || t('news.preview.unknownAuthor') })}
        {article.publishedAt && <> &middot; {t('news.preview.published', { date: formatDateTime(article.publishedAt) })}</>}
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
