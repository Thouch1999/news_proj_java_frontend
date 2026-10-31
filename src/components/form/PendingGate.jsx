import { Navigate } from 'react-router-dom'
import PageSpinner from '../common/PageSpinner'

// What a code page shows instead of its form while usePendingVerification says `gate`: a spinner while the session loads,
// or a redirect (to the start page with "Please start again.", or to the home of a logged-in user).
export default function PendingGate({ gate }) {
  if (gate.loading) {
    return <PageSpinner />
  }
  return <Navigate to={gate.to} replace state={gate.state} />
}
