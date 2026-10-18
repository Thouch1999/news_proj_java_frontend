import { useRef, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { Camera, CheckCircleFill, Envelope, ExclamationTriangleFill, ImageFill, Lock, Trash, Upload } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import UserAvatar from '../common/UserAvatar'
import { RoleBadge } from '../common/UserParts'
import { ROUTES } from '../../constants/routes'
import * as userService from '../../services/userService'
import { errorMessage } from '../../utils/errorMessage'
import { blankToNull } from '../../utils/validators'
import { AvatarUrlDialog, UploadPhotoDialog } from './PhotoDialogs'

// The profile card: a large photo with a camera menu (upload, remove, use a link), the name, @username, the role and
// the details the response has (the email with its verification; the response has no join or update date).
//   user: the logged-in user   onSaved(user): the new user after a photo change   notify(variant, text): shows a toast
export default function ProfileCard({ user, onSaved, notify }) {
  const { t } = useTranslation()
  const name = user.fullName || user.username
  const fileInput = useRef(null)
  const [dialog, setDialog] = useState(null) // { type: 'upload', file } | { type: 'remove' } | { type: 'link' }
  const [busy, setBusy] = useState(false)

  const pick = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // so the same file can be chosen again
    if (file) setDialog({ type: 'upload', file })
  }

  const finish = (updated, messageKey) => {
    onSaved(updated)
    setDialog(null)
    notify('success', t(messageKey))
  }

  const remove = async () => {
    setBusy(true)
    try {
      finish(await userService.removeAvatar(), 'dashboard.profile.avatarRemoved')
    } catch (caught) {
      setDialog(null)
      notify('danger', errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  // the link goes through the profile update, which needs the other saved fields as well
  const saveLink = async (url) =>
    finish(
      await userService.updateMe({ username: user.username, fullName: user.fullName ?? null, address: user.address ?? null, phone: user.phone ?? null, avatar: blankToNull(url) }),
      'dashboard.profile.avatarUpdated',
    )

  return (
    <div className="card profile-card">
      <div className="card-body text-center">
        <div className="profile-avatar mx-auto mb-3">
          <UserAvatar src={user.avatar} name={name} size={128} fallback="initial" className={`user-avatar user-avatar--${user.id % 6}`} />
          <Dropdown align="start" className="profile-avatar__menu">
            <Dropdown.Toggle variant="light" className="profile-avatar__button" aria-label={t('dashboard.profile.photo.change')} title={t('dashboard.profile.photo.change')}>
              <Camera aria-hidden="true" />
            </Dropdown.Toggle>
            <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
              <Dropdown.Item onClick={() => fileInput.current?.click()}>
                <Upload className="me-2" aria-hidden="true" />
                {t('dashboard.profile.photo.upload')}
              </Dropdown.Item>
              {user.avatar && (
                <Dropdown.Item onClick={() => setDialog({ type: 'remove' })}>
                  <Trash className="me-2" aria-hidden="true" />
                  {t('dashboard.profile.photo.remove')}
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDialog({ type: 'link' })}>
                <ImageFill className="me-2" aria-hidden="true" />
                {t('dashboard.profile.photo.useLink')}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="d-none" tabIndex={-1} aria-hidden="true" onChange={pick} />
        </div>

        <h2 className="h5 mb-1">{name}</h2>
        <div className="text-muted mb-2">@{user.username}</div>
        <RoleBadge role={user.role} />

        <ul className="list-unstyled text-start small mt-4 mb-0 profile-details">
          <li>
            <Envelope aria-hidden="true" className="profile-details__icon" />
            <div className="min-w-0">
              <div className="d-flex align-items-center gap-2">
                <span className="text-break">{user.email}</span>
                <Lock aria-hidden="true" className="text-muted flex-shrink-0" title={t('dashboard.profile.emailLocked')} />
                <span className="visually-hidden">{t('dashboard.profile.emailLocked')}</span>
              </div>
              {user.emailVerified ? (
                <span className="profile-verified">
                  <CheckCircleFill aria-hidden="true" /> {t('dashboard.profile.verified')}
                </span>
              ) : (
                <span className="profile-unverified">
                  <ExclamationTriangleFill aria-hidden="true" /> {t('dashboard.profile.notVerified')} &middot;{' '}
                  <Link to={ROUTES.VERIFY_EMAIL} state={{ email: user.email }}>
                    {t('dashboard.profile.verifyEmail')}
                  </Link>
                </span>
              )}
            </div>
          </li>
        </ul>
      </div>

      {dialog?.type === 'upload' && <UploadPhotoDialog file={dialog.file} onCancel={() => setDialog(null)} onUpload={async (file) => finish(await userService.uploadAvatar(file), 'dashboard.profile.avatarUpdated')} />}
      {dialog?.type === 'link' && <AvatarUrlDialog initial={/^https?:\/\//.test(user.avatar ?? '') ? user.avatar : ''} onCancel={() => setDialog(null)} onSave={saveLink} />}
      <ConfirmDialog show={dialog?.type === 'remove'} title={t('dashboard.profile.photo.removeTitle')} confirmLabel={t('dashboard.profile.photo.remove')} confirmVariant="danger" busy={busy} onCancel={() => setDialog(null)} onConfirm={remove}>
        {t('dashboard.profile.photo.removeText')}
      </ConfirmDialog>
    </div>
  )
}
