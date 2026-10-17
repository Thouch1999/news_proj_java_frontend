import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import Pagination from '../../components/common/Pagination'
import { ROLE_VARIANT, ROLES } from '../../constants/roles'
import { adminUserPath, ROUTES } from '../../constants/routes'
import * as userService from '../../services/userService'

const PAGE_SIZE = 10

export default function UsersPage() {
  // search, filters and page live in the URL, so the list can be bookmarked and Back works
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)
  const search = searchParams.get('search') ?? ''
  const role = searchParams.get('role') ?? ''
  const active = searchParams.get('active') ?? ''
  const emailVerified = searchParams.get('emailVerified') ?? ''

  // text typed in the search box but not submitted yet; null means "show what the URL has"
  const [draft, setDraft] = useState(null)
  const searchText = draft ?? search

  // the list is "loading" until the stored result belongs to the current URL parameters
  const queryKey = `${page}|${search}|${role}|${active}|${emailVerified}`
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loading = state.key !== queryKey
  const result = loading ? null : state.data
  const error = loading ? null : state.error

  useEffect(() => {
    let current = true
    userService
      .listUsers({ page, size: PAGE_SIZE, search, role, active, emailVerified })
      .then((data) => {
        if (current) setState({ key: queryKey, data, error: null })
      })
      .catch((caught) => {
        if (current) setState({ key: queryKey, data: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [queryKey, page, search, role, active, emailVerified])

  // change one or more URL parameters; any filter change goes back to page 1
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    if (!('page' in changes)) {
      next.delete('page')
    }
    setSearchParams(next)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setDraft(null)
    updateParams({ search: searchText.trim() })
  }

  const clearFilters = () => {
    setDraft(null)
    setSearchParams(new URLSearchParams())
  }

  const hasFilters = Boolean(search || role || active || emailVerified)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Users</h1>
        <Button as={Link} to={ROUTES.ADMIN_USER_NEW}>
          Create user
        </Button>
      </div>

      <Card body className="mb-3">
        <Form onSubmit={handleSearch}>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label htmlFor="user-search">Search name or email</Form.Label>
              <Form.Control id="user-search" value={searchText} onChange={(event) => setDraft(event.target.value)} placeholder="Search..." />
            </Col>
            <Col sm={4} md={2}>
              <Form.Label htmlFor="filter-role">Role</Form.Label>
              <Form.Select id="filter-role" value={role} onChange={(event) => updateParams({ role: event.target.value })}>
                <option value="">All</option>
                {Object.values(ROLES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col sm={4} md={2}>
              <Form.Label htmlFor="filter-active">Status</Form.Label>
              <Form.Select id="filter-active" value={active} onChange={(event) => updateParams({ active: event.target.value })}>
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Form.Select>
            </Col>
            <Col sm={4} md={2}>
              <Form.Label htmlFor="filter-verified">Email</Form.Label>
              <Form.Select id="filter-verified" value={emailVerified} onChange={(event) => updateParams({ emailVerified: event.target.value })}>
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not verified</option>
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex gap-2">
              <Button type="submit" variant="primary">
                Search
              </Button>
              {hasFilters && (
                <Button type="button" variant="outline-secondary" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </Form>
      </Card>

      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {!loading && result && (
        <>
          <Table responsive hover className="bg-white align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email verified</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No users found.
                  </td>
                </tr>
              )}
              {result.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <Link to={adminUserPath(user.id)}>{user.username}</Link>
                  </td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={ROLE_VARIANT[user.role] ?? 'secondary'}>{user.role}</Badge>
                  </td>
                  <td>{user.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                  <td>{user.emailVerified ? <Badge bg="success">Verified</Badge> : <Badge bg="warning" text="dark">Not verified</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              {result.totalElements} user(s), page {result.totalPages === 0 ? 0 : result.page} of {result.totalPages}
            </span>
            <Pagination page={result.page} totalPages={result.totalPages} onChange={(next) => updateParams({ page: next })} />
          </div>
        </>
      )}
    </div>
  )
}
