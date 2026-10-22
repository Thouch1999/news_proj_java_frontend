import { OverlayTrigger, Placeholder, Tooltip } from 'react-bootstrap'
import { ClockHistory, PersonCircle, ShieldCheck } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import UserAvatar from '../common/UserAvatar'
import { ACTIVITY_ACTIONS } from '../../constants/activity'
import { useFormat } from '../../hooks/useFormat'
import { useNow } from '../../hooks/useNow'
import { actorOf, sentenceOf } from '../../utils/activity'

// The sentence of an entry, built from translations: "<b>Editor</b> published the article <b>“Title”</b>". The actor and the
// target are bold. `targetLink` (optional) makes the target a link (the dashboard card links an article to its editor).
export function ActivitySentence({ entry, targetLink }) {
  const { t } = useTranslation()
  const { key, values } = sentenceOf(t, entry)
  if (!key) {
    // an action this app does not know yet (a newer backend): show it as it is
    return <>{t('activity.fallback', { actor: actorOf(t, entry), action: entry.action })}</>
  }
  const target = targetLink ?? <strong className="activity-target" />
  const admin = entry.action === 'USER_CREATED' && entry.details?.role === 'ADMIN'
  return <Trans i18nKey={key} values={values} components={{ 1: <strong />, 2: target, 3: <strong className={`activity-role${admin ? ' activity-role--admin' : ''}`} /> }} />
}

// The small coloured circle with the icon of the kind of action (create green, edit blue, publish primary, red for a
// reject / delete / failed sign-in, grey for the rest)
export function KindIcon({ action, details, className = '' }) {
  const meta = ACTIVITY_ACTIONS[action]
  // an account created with the ADMIN role gets the shield of the role and the primary colour, not the green of a plain "create"
  const admin = action === 'USER_CREATED' && details?.role === 'ADMIN'
  const Icon = admin ? ShieldCheck : (meta?.icon ?? ClockHistory)
  return (
    <span className={`activity-kind activity-kind--${admin ? 'publish' : (meta?.tone ?? 'other')} ${className}`} aria-hidden="true">
      <Icon />
    </span>
  )
}

// The person: the first letter of the name on a tint (the log has no photo), with the kind of action as a small badge at
// the corner. Nobody was signed in (a failed sign-in): a grey person.
export function ActorAvatar({ entry }) {
  return (
    <span className="activity-lead">
      {entry.actorId ? (
        <UserAvatar name={entry.actorName ?? ''} size={36} fallback="initial" className={`user-avatar user-avatar--${entry.actorId % 6}`} />
      ) : (
        <span className="user-avatar user-avatar--none">
          <PersonCircle aria-hidden="true" />
        </span>
      )}
      <KindIcon action={entry.action} details={entry.details} className="activity-lead__kind" />
    </span>
  )
}

// "5 minutes ago" with the full date in a tooltip
export function EntryTime({ entry }) {
  const { formatAgo, formatFullDate } = useFormat()
  useNow() // renews "5 minutes ago" every minute
  return (
    <OverlayTrigger placement="bottom" overlay={<Tooltip id={`activity-time-${entry.id}`}>{formatFullDate(entry.createdAt)}</Tooltip>}>
      <time className="activity-time" dateTime={entry.createdAt}>
        {formatAgo(entry.createdAt)}
      </time>
    </OverlayTrigger>
  )
}

// One entry of the log: the person, the sentence and, under it, the time and the IP address. The whole row opens the
// details (`onOpen(entry)`).
export default function ActivityRow({ entry, onOpen, selected = false }) {
  const { t } = useTranslation()
  return (
    <li className={`activity-item${selected ? ' is-selected' : ''}`}>
      <button type="button" className="activity-main" onClick={() => onOpen(entry)} aria-label={t('activity.openDetails')} aria-haspopup="dialog">
        <ActorAvatar entry={entry} />
        <span className="activity-body">
          <span className="activity-text">
            <ActivitySentence entry={entry} />
          </span>
          <span className="activity-meta">
            <EntryTime entry={entry} />
            {entry.ipAddress && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span className="activity-ip" dir="ltr">
                  {entry.ipAddress}
                </span>
              </>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

// grey rows while the list loads
export function ActivitySkeleton({ rows = 5 }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      <Placeholder as="div" animation="glow" aria-hidden="true">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="activity-item activity-item--skeleton">
            <span className="user-avatar user-avatar--none" />
            <div className="flex-grow-1">
              <Placeholder xs={10} md={7} className="d-block mb-1" />
              <Placeholder xs={4} md={2} size="sm" className="d-block" />
            </div>
          </div>
        ))}
      </Placeholder>
    </div>
  )
}
