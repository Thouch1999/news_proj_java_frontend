import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Dropdown, Form, Placeholder, Spinner } from 'react-bootstrap'
import { Eye, EyeSlash, ShieldExclamation, ThreeDots } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import UserAvatar from '../common/UserAvatar'
import { adminUserPath, newsPath } from '../../constants/routes'
import { UpdatedCell } from './ArticleListParts'

// The parts of the comment moderation list: a row of the feed, the clamped text and the status badge.

export function CommentStatusBadge({ status }) {
  const { t } = useTranslation()
  return <Badge bg={status === 'HIDDEN' ? 'secondary' : 'success'}>{status === 'HIDDEN' ? t('news.comments.moderation.hidden') : t('news.comments.moderation.visible')}</Badge>
}

// The backend writes the note in English ("Contains a blocked word: casino"); the known one is shown in the selected language
const BLOCKED_WORD_NOTE = /^Contains a blocked word: ([\s\S]+)$/

function noteText(t, note) {
  const found = BLOCKED_WORD_NOTE.exec(note)
  return found ? t('news.comments.moderation.blockedWordNote', { word: found[1] }) : note
}

// The comment as plain text (line breaks kept), three lines and "Show more" when it is longer
function ClampedText({ text }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const measure = () => {
      if (element.classList.contains('is-clamped')) setOverflowing(element.scrollHeight > element.clientHeight + 1)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text])

  return (
    <>
      <div ref={ref} className={`comment-body${expanded ? '' : ' is-clamped'}`}>
        {text}
      </div>
      {(overflowing || expanded) && (
        <Button variant="link" size="sm" className="p-0" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? t('news.comments.moderation.showLess') : t('news.comments.moderation.showMore')}
        </Button>
      )}
    </>
  )
}

// One comment: checkbox, who and when, the text, the article it is on, the status and the actions (Hide / Show and a
// "..." menu). A hidden comment is faded.
export function CommentRow({ comment, area, selected, busy, onSelect, onToggle, onDelete, onFilterArticle, onFilterUser }) {
  const { t } = useTranslation()
  const hidden = comment.status === 'HIDDEN'

  return (
    <li className={`comment-row${hidden ? ' is-hidden' : ''}${selected ? ' is-selected' : ''}`}>
      <Form.Check type="checkbox" className="comment-row__check" aria-label={t('news.comments.moderation.selectRow', { name: comment.userName })} checked={selected} onChange={(event) => onSelect(event.target.checked)} />
      <UserAvatar name={comment.userName ?? ''} fallback="initial" className="article-avatar comment-row__avatar" />
      <div className="comment-row__main min-w-0">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
          <button type="button" className="comment-row__name" title={t('news.comments.moderation.onlyCommenter')} onClick={() => onFilterUser(comment)}>
            {comment.userName}
          </button>
          <span className="text-muted small">
            <UpdatedCell value={comment.createdAt} />
          </span>
          <CommentStatusBadge status={comment.status} />
        </div>
        <ClampedText text={comment.content} />
        {/* why the protection kept it for review (only a moderator gets the note) */}
        {comment.moderationNote && (
          <div className="comment-row__note">
            <ShieldExclamation aria-hidden="true" />
            <span>{noteText(t, comment.moderationNote)}</span>
          </div>
        )}
        <div className="small text-muted mt-1 text-truncate">
          {t('news.comments.moderation.on')}{' '}
          <Link to={area.editPath(comment.newsId)} className="news-title">
            {comment.newsTitle}
          </Link>
        </div>
      </div>
      <div className="comment-row__actions">
        <Button size="sm" variant={hidden ? 'outline-success' : 'outline-secondary'} disabled={busy} onClick={() => onToggle(comment)}>
          {busy ? <Spinner size="sm" animation="border" className="me-1" /> : hidden ? <Eye className="me-1" aria-hidden="true" /> : <EyeSlash className="me-1" aria-hidden="true" />}
          {hidden ? t('news.comments.moderation.show') : t('news.comments.moderation.hide')}
        </Button>
        <Dropdown align="end">
          <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
            <ThreeDots aria-hidden="true" />
          </Dropdown.Toggle>
          <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
            <Dropdown.Item as={Link} to={`${newsPath(comment.newsSlug)}#comments-title`} target="_blank" rel="noopener noreferrer">
              {t('news.comments.moderation.viewOnSite')}
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onFilterArticle(comment)}>{t('news.comments.moderation.onlyArticle')}</Dropdown.Item>
            {area.admin && (
              <Dropdown.Item as={Link} to={adminUserPath(comment.userId)}>
                {t('news.comments.moderation.viewUser')}
              </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item className="text-danger" onClick={() => onDelete(comment)}>
              {t('common.actions.delete')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </li>
  )
}

// Grey rows while the page loads
export function CommentSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="d-flex gap-3 px-3 py-3 comment-skeleton-row">
            <Placeholder className="rounded-circle flex-shrink-0" style={{ width: 28, height: 28 }} />
            <div className="flex-grow-1">
              <Placeholder xs={4} size="sm" className="d-block mb-2" />
              <Placeholder xs={12} className="d-block mb-1" />
              <Placeholder xs={7} className="d-block" />
            </div>
          </div>
        ))}
      </Placeholder>
    </div>
  )
}
