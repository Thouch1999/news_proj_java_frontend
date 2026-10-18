import { useCallback, useState } from 'react'
import { Card, Col, Row, Toast, ToastContainer } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../common/ConfirmDialog'
import SectionTitle from '../common/SectionTitle'
import { StatusTabs } from '../news/ArticleListParts'
import { useAuth } from '../../hooks/useAuth'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning'
import PasswordChangeForm from './PasswordChangeForm'
import PreferencesPane from './PreferencesPane'
import ProfileCard from './ProfileCard'
import ProfileDetailsForm from './ProfileDetailsForm'

const TABS = ['profile', 'password', 'preferences']

// "My profile" for the dashboard (`area="dashboard"`) and the public site (`area="public"`): the profile card on the
// left and the tabs on the right (one column on a phone, the card first). The active tab is in the URL (?tab=password).
// A tab with unsaved changes asks before it is left, and so does leaving the page.
export default function ProfileView({ area = 'dashboard' }) {
  const { t } = useTranslation()
  usePageMeta(t('dashboard.profile.title'))
  const { user, updateUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const asked = searchParams.get('tab')
  const tab = TABS.includes(asked) ? asked : 'profile'
  const [dirty, setDirty] = useState(false)
  const [leaveTo, setLeaveTo] = useState(null) // the tab waiting for "Discard"
  const [toast, setToast] = useState(null)
  const { blocker } = useUnsavedChangesWarning(dirty)

  const notify = useCallback((variant, text) => setToast({ variant, text }), [])
  const markDirty = useCallback((value) => setDirty(value), [])

  const open = (next) => {
    setDirty(false)
    setLeaveTo(null)
    setSearchParams(next === 'profile' ? {} : { tab: next }, { replace: true })
  }
  const select = (next) => {
    if (next === tab) return
    if (dirty) setLeaveTo(next)
    else open(next)
  }

  const isPublic = area === 'public'
  const tabs = TABS.map((value) => ({ value, label: t(`dashboard.profile.tabs.${value}`) }))

  return (
    <div className={`profile-page profile-page--${area}`}>
      <div className="mb-4">
        {isPublic ? (
          <SectionTitle as="h1">{t('dashboard.profile.title')}</SectionTitle>
        ) : (
          <h1 className="h4 mb-1">{t('dashboard.profile.title')}</h1>
        )}
        <p className="text-muted small mb-0">{t('dashboard.profile.intro')}</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <div className="profile-sticky">
            <ProfileCard user={user} onSaved={updateUser} notify={notify} />
          </div>
        </Col>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <StatusTabs tabs={tabs} active={tab} label={t('dashboard.profile.tabsLabel')} onChange={select} />
              <div role="tabpanel" aria-label={t(`dashboard.profile.tabs.${tab}`)}>
                {tab === 'profile' && <ProfileDetailsForm key="profile" user={user} onSaved={updateUser} onDirtyChange={markDirty} notify={notify} />}
                {tab === 'password' && <PasswordChangeForm key="password" onDirtyChange={markDirty} notify={notify} />}
                {tab === 'preferences' && <PreferencesPane key="preferences" />}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <ConfirmDialog show={Boolean(leaveTo)} title={t('dashboard.profile.discard.title')} confirmLabel={t('dashboard.profile.discard.confirm')} confirmVariant="danger" onCancel={() => setLeaveTo(null)} onConfirm={() => open(leaveTo)}>
        {t('dashboard.profile.discard.body')}
      </ConfirmDialog>
      <ConfirmDialog show={blocker.state === 'blocked'} title={t('dashboard.profile.discard.title')} confirmLabel={t('dashboard.profile.discard.confirm')} confirmVariant="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>
        {t('dashboard.profile.discard.body')}
      </ConfirmDialog>

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
