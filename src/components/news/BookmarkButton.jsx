import { Button } from 'react-bootstrap'
import { Bookmark, BookmarkFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useBookmarks } from '../../hooks/useBookmarks'

// Save / unsave an article. The icon changes at once and goes back if the backend refuses (see BookmarkProvider).
// A guest is sent to the login page and comes back to this page afterwards.
//   variant="icon": a round icon button (for cards);  variant="full": a button with a label (article page)
export default function BookmarkButton({ newsId, title, variant = 'icon', className = '' }) {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { loaded, isBookmarked, isPending, toggle } = useBookmarks()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = isAuthenticated && isBookmarked(newsId)

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location, message: t('public.bookmark.loginMessage'), variant: 'info' } })
      return
    }
    toggle(newsId)
  }

  const label = saved ? t('public.bookmark.remove') : t('public.bookmark.add')
  const Icon = saved ? BookmarkFill : Bookmark
  // a logged-in user can click once the saved articles are known (and no request for this one is running)
  const disabled = isAuthenticated && (!loaded || isPending(newsId))

  if (variant === 'full') {
    return (
      <Button variant={saved ? 'primary' : 'outline-primary'} className={className} onClick={handleClick} disabled={disabled} aria-pressed={saved} aria-label={title ? t('public.bookmark.labelWithTitle', { label, title }) : label}>
        <Icon className="me-2" />
        {saved ? t('public.bookmark.saved') : t('public.bookmark.save')}
      </Button>
    )
  }

  return (
    <Button
      variant="light"
      size="sm"
      className={`rounded-circle shadow-sm border ${saved ? 'text-primary' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={title ? t('public.bookmark.labelWithTitle', { label, title }) : label}
      title={isAuthenticated ? label : t('public.bookmark.loginTitle')}
    >
      <Icon />
    </Button>
  )
}
