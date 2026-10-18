import { Fragment, useMemo, useState } from 'react'
import { Button, Card, Col, Form, OverlayTrigger, Placeholder, Row, Table, Tooltip } from 'react-bootstrap'
import { Check2, Search } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, RowsSkeleton } from '../../components/common/ListStates'
import SearchBox from '../../components/common/SearchBox'
import { FULL_CONTROL_ROLE, PERMISSION_GROUPS, UNUSED_PERMISSIONS } from '../../constants/permissions'
import { ROLE_ICON, ROLES } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as reportService from '../../services/reportService'
import * as roleService from '../../services/roleService'

const ROLE_ORDER = Object.values(ROLES)
const KNOWN = new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions))

// One card per role: icon, name, what the role does in plain words and the number of users (a link to the Users page
// filtered by the role; left out when the numbers could not be loaded).
function RoleSummaryCard({ role, count }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const Icon = ROLE_ICON[role]
  return (
    <Card body className="h-100 role-card">
      <div className="d-flex align-items-center gap-3 mb-2">
        <span className={`role-card__icon role-badge--${role}`} aria-hidden="true">
          <Icon />
        </span>
        <h2 className="h6 mb-0">{t(`common.roles.${role}`)}</h2>
      </div>
      <p className="text-muted small mb-2">{t(`dashboard.roles.summary.${role}`)}</p>
      {typeof count === 'number' && (
        <Link to={`${ROUTES.ADMIN_USERS}?role=${role}`} className="small fw-semibold">
          {t('dashboard.roles.users', { count, formattedCount: formatNumber(count) })}
        </Link>
      )}
    </Card>
  )
}

function SummarySkeleton() {
  const { t } = useTranslation()
  return (
    <Row xs={1} md={2} xl={4} className="g-3 mb-4" role="status">
      <span className="visually-hidden">{t('common.loading')}</span>
      {ROLE_ORDER.map((role) => (
        <Col key={role} aria-hidden="true">
          <Card body className="h-100">
            <Placeholder as="div" animation="glow">
              <Placeholder xs={5} className="d-block mb-3" />
              <Placeholder xs={11} size="sm" className="d-block mb-1" />
              <Placeholder xs={4} size="sm" className="d-block" />
            </Placeholder>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

// ✓ (with text for screen readers), the lighter "✓ (full control)" or a muted dash
function Cell({ state }) {
  const { t } = useTranslation()
  if (state === 'no') {
    return (
      <span className="perm-no" title={t('dashboard.roles.notAllowed')}>
        <span aria-hidden="true">&ndash;</span>
        <span className="visually-hidden">{t('dashboard.roles.notAllowed')}</span>
      </span>
    )
  }
  return (
    <span className={`perm-yes${state === 'full' ? ' is-full' : ''}`}>
      <Check2 aria-hidden="true" size={20} />
      <span className="visually-hidden">{t('dashboard.roles.allowed')}</span>
      {state === 'full' && <span className="perm-full small">({t('dashboard.roles.fullControl')})</span>}
    </span>
  )
}

function PermissionLabel({ name, label, showCodes }) {
  const { t } = useTranslation()
  return (
    <>
      <OverlayTrigger placement="top-start" overlay={<Tooltip id={`perm-${name}`}>{name}</Tooltip>}>
        <span className="perm-label" tabIndex={0}>
          {label}
        </span>
      </OverlayTrigger>
      {UNUSED_PERMISSIONS.includes(name) && (
        <span className="perm-unused badge rounded-pill ms-2" title={t('dashboard.roles.notUsedHint')}>
          {t('dashboard.roles.notUsed')}
        </span>
      )}
      {showCodes && (
        <div className="small text-muted perm-code">
          <code>{name}</code>
        </div>
      )}
    </>
  )
}

// The Roles page (admin, read-only): what each role can do. Roles are fixed; a user's role is changed on the Users page.
export default function RolesPage() {
  const { t, i18n } = useTranslation()
  usePageMeta(t('dashboard.roles.title'))
  const [tick, setTick] = useState(0)
  const { data: roles, error, loading } = useRemoteData(`roles|${tick}`, () => roleService.listRoles())
  // the numbers are a bonus: without them the cards just have no count
  const { data: summary } = useRemoteData(`summary|${tick}`, () => reportService.getSummary().catch(() => null))
  const counts = summary?.usersByRole
  const [query, setQuery] = useState('')
  const [showCodes, setShowCodes] = useState(false)

  const rolePermissions = useMemo(() => Object.fromEntries((roles ?? []).map((role) => [role.name, new Set(role.permissions)])), [roles])

  // known groups in order, then "other" for any permission the data has that is not listed
  const groups = useMemo(() => {
    const all = new Set((roles ?? []).flatMap((role) => role.permissions))
    const result = PERMISSION_GROUPS.map((group) => ({ id: group.id, names: group.permissions }))
    const other = [...all].filter((name) => !KNOWN.has(name)).sort()
    if (other.length > 0) result.push({ id: 'other', names: other })
    return result
  }, [roles])

  const label = (name) => t(`dashboard.roles.permissions.${name}`, { defaultValue: name })
  const needle = query.trim().toLowerCase()
  const visible = useMemo(
    () => groups.map((group) => ({ ...group, names: group.names.filter((name) => !needle || label(name).toLowerCase().includes(needle) || name.toLowerCase().includes(needle)) })).filter((group) => group.names.length > 0),
    // `label` follows the language
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, needle, i18n.language],
  )

  const state = (role, name) => {
    if (rolePermissions[role]?.has(name)) return 'yes'
    return role === FULL_CONTROL_ROLE ? 'full' : 'no'
  }
  const hasFullControlCell = visible.some((group) => group.names.some((name) => state(FULL_CONTROL_ROLE, name) === 'full'))

  return (
    <div>
      <div className="mb-3">
        <h1 className="h4 mb-1">{t('dashboard.roles.title')}</h1>
        <p className="text-muted small mb-0">
          <Trans i18nKey="dashboard.roles.intro" components={{ 1: <Link to={ROUTES.ADMIN_USERS} /> }} />
        </p>
      </div>

      {loading && (
        <>
          <SummarySkeleton />
          <Card className="article-card">
            <RowsSkeleton rows={8} />
          </Card>
        </>
      )}

      {error && (
        <Card className="article-card">
          <ErrorState error={error} onRetry={() => setTick((value) => value + 1)} />
        </Card>
      )}

      {roles && (
        <>
          <Row xs={1} md={2} xl={4} className="g-3 mb-4">
            {ROLE_ORDER.map((role) => (
              <Col key={role}>
                <RoleSummaryCard role={role} count={counts?.[role]} />
              </Col>
            ))}
          </Row>

          <Card className="article-card">
            <div className="article-toolbar d-flex flex-wrap align-items-center gap-3 p-3">
              <SearchBox value={query} onChange={setQuery} label={t('dashboard.roles.searchLabel')} placeholder={t('dashboard.roles.searchPlaceholder')} />
              <Form.Check type="switch" id="show-codes" className="mb-0" label={t('dashboard.roles.showCodes')} checked={showCodes} onChange={(event) => setShowCodes(event.target.checked)} />
            </div>
            {hasFullControlCell && <p className="text-muted small px-3 pt-3 mb-0">{t('dashboard.roles.adminNote')}</p>}

            {visible.length === 0 ? (
              <EmptyState icon={Search} text={t('dashboard.roles.emptySearch')}>
                <Button variant="outline-primary" size="sm" onClick={() => setQuery('')}>
                  {t('news.list.toolbar.clear')}
                </Button>
              </EmptyState>
            ) : (
              <div className="article-table-wrap mt-2">
                <Table className="article-table roles-table align-middle mb-0">
                  <caption className="visually-hidden">{t('dashboard.roles.tableCaption')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('dashboard.roles.permission')}</th>
                      {ROLE_ORDER.map((role) => (
                        <th key={role} scope="col" className="text-center">
                          {t(`common.roles.${role}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((group) => (
                      <Fragment key={group.id}>
                        <tr className="roles-group">
                          <th scope="colgroup" colSpan={ROLE_ORDER.length + 1}>
                            {t(`dashboard.roles.groups.${group.id}`)}
                          </th>
                        </tr>
                        {group.names.map((name) => (
                          <tr key={name}>
                            <th scope="row" className="roles-permission">
                              <PermissionLabel name={name} label={label(name)} showCodes={showCodes} />
                            </th>
                            {ROLE_ORDER.map((role) => (
                              <td key={role} className="text-center">
                                <Cell state={state(role, name)} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
