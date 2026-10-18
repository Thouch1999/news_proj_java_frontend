import { useSettings } from '../../hooks/useSettings'
import { usePageMeta } from '../../hooks/usePageMeta'

// What every auth page shows inside the AuthLayout: the logo, the title and one line of description (centred), the form
// in a card (a notice such as "Your session has expired" is the first thing inside it), and the secondary action as one
// line of text under the card. The browser tab gets the title.
//   title, description: text   notice: a node shown at the top of the card   secondary: a node for the line under the card
//   wide: the 560px card of Register (two columns); the others are 400px
export default function AuthPage({ title, description, notice, secondary, wide = false, children }) {
  const { logoSrc } = useSettings()
  usePageMeta(title, description)
  return (
    <div className={`auth-column${wide ? ' auth-column--wide' : ''}`}>
      <div className="auth-head">
        <img src={logoSrc} alt="" height="40" className="site-logo auth-logo" />
        <h1 className="auth-title">{title}</h1>
        {description && <p className="auth-description">{description}</p>}
      </div>
      <div className="auth-card">
        {notice}
        {children}
      </div>
      {secondary && <p className="auth-secondary">{secondary}</p>}
    </div>
  )
}
