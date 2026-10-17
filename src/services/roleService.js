import httpClient from './httpClient'

// [{ id, name, description, permissions: [names] }]
export function listRoles() {
  return httpClient.get('/api/v1/roles')
}
