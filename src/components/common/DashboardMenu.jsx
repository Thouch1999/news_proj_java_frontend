import { useState } from 'react'
import { Badge, Collapse, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ChevronRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

// The menu of the dashboard sidebar (built by buildMenu() in constants/dashboardMenu.js): single entries and groups that open
// like an accordion.
//  - full: a group header (icon, label, chevron) opens its entries; only one group is open; the group of the current page opens on
//    load and on navigation and always wins over the group remembered in localStorage.
//  - collapsed (icon only, tablet): a group is an icon whose click opens a small flyout menu (a Dropdown: arrow keys, Enter, Esc),
//    a single entry is an icon with a tooltip.
// `pending` is the review count of the badge (it is also shown on the header of a closed group that holds that entry).

const STORAGE_KEY = 'news-dashboard-menu-group'

function remembered() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

function remember(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id ?? '')
  } catch {
    // blocked storage: the menu simply starts closed next time
  }
}

const isCurrent = (item, pathname) => Boolean(matchPath({ path: item.to, end: item.end ?? false }, pathname))
const groupOf = (nodes, pathname) => nodes.find((node) => node.type === 'group' && node.items.some((item) => isCurrent(item, pathname)))?.id ?? null
const countOf = (item, pending) => (item.badge === 'review' && pending > 0 ? pending : 0)

function CountBadge({ count, label, className = '' }) {
  if (count <= 0) return null
  return (
    <Badge pill bg="" className={`menu-badge ${className}`} aria-label={label}>
      {count > 99 ? '99+' : count}
    </Badge>
  )
}

export default function DashboardMenu({ nodes, pending, collapsed = false, onNavigate }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => groupOf(nodes, pathname) ?? remembered())
  const [seen, setSeen] = useState(pathname)

  // navigating opens the group of the new page (state set while rendering: a value derived from a change)
  if (seen !== pathname) {
    setSeen(pathname)
    const current = groupOf(nodes, pathname)
    if (current && current !== open) {
      setOpen(current)
      remember(current)
    }
  }

  const toggle = (id) => {
    const next = open === id ? null : id // accordion: opening one closes the others, a click on the open one closes it
    setOpen(next)
    remember(next)
  }
  const pendingLabel = (count) => t('dashboard.menu.pendingCount', { count })

  const label = (key) => t(key)

  // ---- one entry ----
  const link = (item, { sub = false, flyout = false } = {}) => {
    const Icon = item.icon
    const count = countOf(item, pending)
    const content = (
      <>
        {!sub && !flyout && Icon && <Icon className="menu-icon" aria-hidden="true" />}
        <span className="menu-label">{label(item.labelKey)}</span>
        <CountBadge count={count} label={pendingLabel(count)} className={collapsed && !flyout ? 'menu-badge--dot' : ''} />
      </>
    )
    if (flyout) {
      return (
        <Dropdown.Item key={item.to} as={NavLink} to={item.to} end={item.end ?? false} onClick={onNavigate} className="d-flex align-items-center gap-2">
          {content}
        </Dropdown.Item>
      )
    }
    const anchor = (
      <NavLink key={item.to} to={item.to} end={item.end ?? false} onClick={onNavigate} className={`nav-link${sub ? ' menu-sub' : ''}`} aria-label={collapsed ? label(item.labelKey) : undefined}>
        {content}
      </NavLink>
    )
    if (!collapsed) return anchor
    return (
      <OverlayTrigger key={item.to} placement="right" overlay={<Tooltip id={`tip-${item.to}`}>{label(item.labelKey)}</Tooltip>}>
        {anchor}
      </OverlayTrigger>
    )
  }

  return (
    <nav className="dashboard-menu" aria-label={t('dashboard.menu.label')}>
      {nodes.map((node) => {
        if (node.type === 'item') return link(node)

        const Icon = node.icon
        const total = node.items.reduce((sum, item) => sum + countOf(item, pending), 0)
        const active = node.items.some((item) => isCurrent(item, pathname))

        // collapsed: the group is an icon with a flyout menu next to it
        if (collapsed) {
          return (
            <Dropdown key={node.id} drop="end" className="menu-flyout">
              <Dropdown.Toggle as="button" type="button" className={`nav-link menu-group-toggle${active ? ' is-current' : ''}`} aria-label={label(node.labelKey)} title={label(node.labelKey)}>
                <Icon className="menu-icon" aria-hidden="true" />
                <CountBadge count={total} label={pendingLabel(total)} className="menu-badge--dot" />
              </Dropdown.Toggle>
              <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                <Dropdown.Header>{label(node.labelKey)}</Dropdown.Header>
                {node.items.map((item) => link(item, { flyout: true }))}
              </Dropdown.Menu>
            </Dropdown>
          )
        }

        const isOpen = open === node.id
        const panel = `menu-group-${node.id}`
        return (
          <div key={node.id} className="menu-group">
            <button type="button" className={`nav-link menu-group-toggle${active ? ' is-current' : ''}${isOpen ? ' is-open' : ''}`} aria-expanded={isOpen} aria-controls={panel} onClick={() => toggle(node.id)}>
              <Icon className="menu-icon" aria-hidden="true" />
              <span className="menu-label">{label(node.labelKey)}</span>
              {!isOpen && <CountBadge count={total} label={pendingLabel(total)} />}
              <ChevronRight className="menu-chevron" aria-hidden="true" />
            </button>
            <Collapse in={isOpen}>
              <div id={panel}>
                <div className="menu-sub-list">{node.items.map((item) => link(item, { sub: true }))}</div>
              </div>
            </Collapse>
          </div>
        )
      })}
    </nav>
  )
}
