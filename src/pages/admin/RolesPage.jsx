import { useEffect, useState } from 'react'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import { ROLE_VARIANT } from '../../constants/roles'
import * as roleService from '../../services/roleService'

export default function RolesPage() {
  const [roles, setRoles] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let current = true
    roleService
      .listRoles()
      .then((data) => {
        if (current) setRoles(data)
      })
      .catch((caught) => {
        if (current) setError(caught)
      })
    return () => {
      current = false
    }
  }, [])

  return (
    <div>
      <h1 className="h4 mb-1">Roles</h1>
      <p className="text-muted">Read-only: what each role is allowed to do.</p>
      <ErrorAlert error={error} />
      {!roles && !error && <PageSpinner />}
      <Row className="g-3">
        {roles?.map((role) => (
          <Col md={6} key={role.id}>
            <Card body>
              <h2 className="h6">
                <Badge bg={ROLE_VARIANT[role.name] ?? 'secondary'}>{role.name}</Badge>
              </h2>
              <p className="text-muted small">{role.description}</p>
              <div className="d-flex flex-wrap gap-1">
                {role.permissions.length === 0 && <span className="text-muted small">No permissions.</span>}
                {role.permissions.map((permission) => (
                  <Badge key={permission} bg="light" text="dark" className="border">
                    {permission}
                  </Badge>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
