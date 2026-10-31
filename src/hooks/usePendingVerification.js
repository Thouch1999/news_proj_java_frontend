import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OTP_PURPOSE } from '../constants/otp'
import { clearPending, loadPending, savePending, updatePending } from '../utils/pendingVerification'
import { postLoginPath } from '../utils/postLoginPath'
import { useAuth } from './useAuth'

// The code step of register, staff login and reset password, kept across a refresh (see utils/pendingVerification.js).
//   purpose    OTP_PURPOSE.REGISTER | LOGIN | RESET_PASSWORD
//   startPath  where to go when nothing valid is pending (register, login or forgot password)
//   send       async (email) => sends a new code (the call differs per purpose)
//   linkEmail  REGISTER only: the email of a "verify your email" link, which starts a pending verification without a new code
// Returns { gate, pending, resendRemaining, expired, sending, notice, setNotice, focusSignal, resend, clear }.
// A page shows <PendingGate gate={gate} /> while `gate` is set (loading, redirect to the start page with "Please start
// again.", or redirect of a logged-in user), reads the countdowns from here and calls resend() / clear().
export function usePendingVerification({ purpose, startPath, send, linkEmail }) {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [pending, setPending] = useState(() => {
    const stored = loadPending(purpose)
    return linkEmail && stored?.email !== linkEmail ? savePending({ purpose, email: linkEmail, codeSent: false }) : stored
  })
  const [now, setNow] = useState(Date.now)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null)
  const [focusSignal, setFocusSignal] = useState(0)

  // one tick a second; the times come from the clock, so a throttled background tab is right when it wakes up
  useEffect(() => {
    if (!pending) {
      return undefined
    }
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [pending])

  const resendRemaining = pending ? Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000)) : 0
  const expired = pending?.codeExpiresAt != null && now >= pending.codeExpiresAt

  // an unverified reader may open "verify email" from the profile; every other logged-in user goes to the start page
  const mayStayLoggedIn = purpose === OTP_PURPOSE.REGISTER && user && !user.emailVerified
  let gate = null
  if (isLoading) {
    gate = { loading: true }
  } else if (isAuthenticated && !mayStayLoggedIn) {
    gate = { to: postLoginPath(user) }
  } else if (!pending) {
    gate = { to: startPath, state: { message: t('auth.pending.startAgain'), variant: 'info' } }
  }

  // sends a new code; returns null, or the error (a rate-limit error also moves the time when a resend is allowed)
  const resend = async () => {
    setSending(true)
    setNotice(null)
    try {
      await send(pending.email)
      const next = savePending({ purpose, email: pending.email })
      setPending(next)
      setNow(Date.now())
      setNotice(t('auth.pending.resentTo', { email: next.maskedEmail }))
      setFocusSignal((signal) => signal + 1)
      return null
    } catch (error) {
      if (error?.retryUntil) {
        updatePending({ resendAvailableAt: error.retryUntil })
        setPending((current) => current && { ...current, resendAvailableAt: error.retryUntil })
      }
      return error
    } finally {
      setSending(false)
    }
  }

  // verified, or "use a different account": the pending verification is over (the page then navigates away)
  const clear = () => clearPending()

  return { gate, pending, resendRemaining, expired, sending, notice, setNotice, focusSignal, resend, clear }
}
