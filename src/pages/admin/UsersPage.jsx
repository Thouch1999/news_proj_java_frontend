import { useEffect, useState } from 'react'
import { Button, Card, Form, Table, Toast, ToastContainer } from 'react-bootstrap'
import { People } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState, ErrorState, RowsSkeleton } from '../../components/common/ListStates'
import SearchBox from '../../components/common/SearchBox'
import { RoleBadge, RoleDialog, UserActions, UserCell, UserStatus } from '../../components/common/UserParts'
import ResetPasswordDialog from '../../components/form/ResetPasswordDialog'
import { ArticleFooter, StatusTabs } from '../../components/news/ArticleListParts'
import { ARTICLE_PAGE_SIZES } from '../../constants/newsStatus'
import { ROLES } from '../../constants/roles'
import { adminUserPath, ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import * as reportService from '../../services/reportService'
import * as userService from '../../services/userService'
import { errorMessage } from '../../utils/errorMessage'
import { userName } from '../../utils/userName'

const SEARCH_DELAY = 400
const DEFAULT_SIZE = ARTICLE_PAGE_SIZES[0]
const ROLE_TABS = ['', ...Object.values(ROLES)]

// The Users page (admin): role tabs with counts, search (after a short pause), status and email filters, and a row per
// user with a "..." menu. Everything but the search text lives in the URL: ?role=EDITOR&active=false&emailVerified=false
//
// The list does not say when an account was created, so there is no "Joined" column. A user has exactly one role, so
// "Edit role" chooses one.
export default function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const askedSize = parseInt(searchParams.get('size') ?? '', 10)
  const size = ARTICLE_PAGE_SIZES.includes(askedSize) ? askedSize : DEFAULT_SIZE
  const search = searchParams.get('search') ?? ''
  const role = ROLE_TABS.includes(searchParams.get('role') ?? '') ? (searchParams.get('role') ?? '') : ''
  const active = ['true', 'false'].includes(searchParams.get('active')) ? searchParams.get('active') : ''
  const emailVerified = ['true', 'false'].includes(searchParams.get('emailVerified')) ? searchParams.get('emailVerified') : ''

  const queryKey = `${page}|${size}|${search}|${role}|${active}|${emailVerified}`
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const result = loading ? null : state.data
  const error = loading ? null : state.error
  const items = result?.items ?? []

  const change = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value === '' || value === undefined || value === null ? next.delete(name) : next.set(name, String(value))))
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  useEffect(() => {
    let current = true
    userService
      .listUsers({ page, size, search, role, active, emailVerified })
      .then((data) => {
        if (!current) return
        setState({ key: queryKey, data, error: null })
        // the last page was emptied: go to the new last page
        if (data.items.length === 0 && page > 1) {
          setSearchParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('page', String(Math.max(data.totalPages, 1)))
            return next
          }, { replace: true })
        }
      })
      .catch((caught) => current && setState({ key: queryKey, data: null, error: caught }))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, tick])

  // the numbers on the role tabs (the whole site: they do not follow the search and the other filters)
  const [counts, setCounts] = useState(null)
  const [countsTick, setCountsTick] = useState(0)
  useEffect(() => {
    let current = true
    reportService
      .getSummary()
      .then((summary) => current && setCounts({ '': summary.totalUsers, ...summary.usersByRole }))
      .catch(() => {
        // the tabs work without the numbers
      })
    return () => {
      current = false
    }
  }, [countsTick])
  const reload = () => {
    setTick((value) => value + 1)
    setCountsTick((value) => value + 1)
  }

  // search: typing does not change the URL until the typing stops
  const [draft, setDraft] = useState(null) // null: show what the URL has
  const searchText = draft ?? search
  useEffect(() => {
    if (draft === null) return undefined
    const timer = setTimeout(() => {
      if (draft.trim() !== search) change({ search: draft.trim() })
      setDraft(null)
    }, SEARCH_DELAY)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const hasFilters = Boolean(search || active || emailVerified)
  const filtered = hasFilters || Boolean(role)
  const clearFilters = () => {
    setDraft(null)
    change({ search: '', active: '', emailVerified: '' })
  }
  const clearAll = () => {
    setDraft(null)
    setSearchParams(new URLSearchParams())
  }

  const { state: locationState } = useLocation()
  const [toast, setToast] = useState(() => (locationState?.messageKey ? { variant: 'success', text: t(locationState.messageKey) } : null))
  const [dialog, setDialog] = useState(null) // { type: 'deactivate' | 'role' | 'password', user }
  const [chosenRole, setChosenRole] = useState('')
  const [busy, setBusy] = useState(false)

  // a changed user: the row follows the filters, and the tab numbers follow the change
  const applyUpdated = (before, after) => {
    setState((current) => {
      if (!current.data) return current
      const stays = (!role || after.role === role) && (!active || String(after.active) === active)
      const list = stays ? current.data.items.map((row) => (row.id === after.id ? after : row)) : current.data.items.filter((row) => row.id !== after.id)
      return { ...current, data: { ...current.data, items: list, totalElements: current.data.totalElements - (stays ? 0 : 1) } }
    })
    if (before.role !== after.role) setCounts((current) => current && { ...current, [before.role]: current[before.role] - 1, [after.role]: current[after.role] + 1 })
  }

  const run = async (user, action, doneKey) => {
    setBusy(true)
    try {
      const updated = await action()
      if (updated) applyUpdated(user, updated)
      setToast({ variant: 'success', text: t(doneKey) })
      setDialog(null)
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
      setDialog(null)
    } finally {
      setBusy(false)
    }
  }
  const toggleActive = (user) => (user.active ? setDialog({ type: 'deactivate', user }) : run(user, () => userService.activateUser(user.id), 'users.detail.activated'))
  const target = dialog?.user

  const actions = (user) => (
    <UserActions
      user={user}
      isSelf={me?.id === user.id}
      viewer={me}
      onToggleActive={toggleActive}
      onResetPassword={(row) => setDialog({ type: 'password', user: row })}
      onEditRole={(row) => {
        setChosenRole(row.role)
        setDialog({ type: 'role', user: row })
      }}
    />
  )
  // the whole row opens the user; a click on a link or a button in it does its own thing
  const open = (user, event) => {
    if (event.target.closest('a, button, input, [role="menuitem"]')) return
    navigate(adminUserPath(user.id))
  }
  const tabs = ROLE_TABS.map((value) => ({ value, label: t(value ? `common.roles.${value}` : 'users.list.all'), count: counts?.[value] }))

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t('users.list.title')}</h1>
          <p className="text-muted small mb-0">{t('users.list.intro')}</p>
        </div>
        <Button as={Link} to={ROUTES.ADMIN_USER_NEW}>
          {t('users.list.create')}
        </Button>
      </div>

      <StatusTabs tabs={tabs} active={role} label={t('users.fields.role')} onChange={(value) => change({ role: value })} />

      <Card className="article-card">
        <div className="article-toolbar d-flex flex-wrap align-items-center gap-2 p-3">
          <SearchBox value={searchText} onChange={setDraft} label={t('users.list.searchLabel')} placeholder={t('users.list.searchPlaceholder')} />
          <Form.Select size="sm" className="w-auto-md" aria-label={t('users.fields.status')} value={active} onChange={(event) => change({ active: event.target.value })}>
            <option value="">{t('users.list.anyStatus')}</option>
            <option value="true">{t('users.status.active')}</option>
            <option value="false">{t('users.status.inactive')}</option>
          </Form.Select>
          <Form.Select size="sm" className="w-auto-md" aria-label={t('users.fields.emailVerified')} value={emailVerified} onChange={(event) => change({ emailVerified: event.target.value })}>
            <option value="">{t('users.list.anyEmail')}</option>
            <option value="true">{t('users.status.verified')}</option>
            <option value="false">{t('users.status.notVerified')}</option>
          </Form.Select>
          {hasFilters && (
            <Button variant="link" size="sm" className="p-0" onClick={clearFilters}>
              {t('news.list.toolbar.clear')}
            </Button>
          )}
        </div>

        {loading && <RowsSkeleton />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {result && items.length === 0 && page === 1 && (
          <EmptyState icon={People} text={filtered ? t('users.list.emptyFiltered') : t('users.list.emptyNone')}>
            {filtered && (
              <Button variant="outline-primary" size="sm" onClick={clearAll}>
                {t('news.list.toolbar.clear')}
              </Button>
            )}
          </EmptyState>
        )}

        {items.length > 0 && (
          <>
            <div className="article-table-wrap d-none d-md-block">
              <Table hover className="article-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('users.list.user')}</th>
                    <th>{t('users.list.roles')}</th>
                    <th>{t('users.fields.status')}</th>
                    <th className="text-end">{t('news.list.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user.id} className={`user-row${user.active ? '' : ' is-inactive'}`} onClick={(event) => open(user, event)}>
                      <td>
                        <UserCell user={user} isSelf={me?.id === user.id} />
                      </td>
                      <td>
                        <RoleBadge role={user.role} />
                      </td>
                      <td>
                        <UserStatus user={user} />
                      </td>
                      <td className="text-end text-nowrap">{actions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="article-cards list-unstyled mb-0 d-md-none">
              {items.map((user) => (
                <li key={user.id} className={`user-row${user.active ? '' : ' is-inactive'}`} onClick={(event) => open(user, event)}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <UserCell user={user} isSelf={me?.id === user.id} />
                    {actions(user)}
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2 small">
                    <RoleBadge role={user.role} />
                    <UserStatus user={user} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {result && result.totalElements > 0 && (
          <ArticleFooter result={result} size={size} onPage={(next) => change({ page: next })} onSize={(value) => change({ size: value === DEFAULT_SIZE ? '' : value })} />
        )}
      </Card>

      <ConfirmDialog
        show={dialog?.type === 'deactivate'}
        title={t('users.detail.deactivate')}
        confirmLabel={t('users.detail.deactivateShort')}
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(target, () => userService.deactivateUser(target.id), 'users.detail.deactivated')}
      >
        {target && t('users.detail.deactivateText', { username: userName(target) })}
      </ConfirmDialog>

      {dialog?.type === 'role' && (
        <RoleDialog
          user={target}
          isSelf={me?.id === target.id}
          viewer={me}
          selected={chosenRole}
          busy={busy}
          onSelect={setChosenRole}
          onCancel={() => setDialog(null)}
          onConfirm={() => run(target, () => userService.changeUserRole(target.id, chosenRole), 'users.detail.roleChanged')}
        />
      )}

      {dialog?.type === 'password' && (
        <ResetPasswordDialog username={userName(target)} busy={busy} onCancel={() => setDialog(null)} onConfirm={(form) => run(target, () => userService.resetUserPassword(target.id, form), 'users.detail.passwordReset')} />
      )}

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
