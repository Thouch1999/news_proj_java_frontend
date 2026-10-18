import { ClipboardCheck, Pencil } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

const ROLE_ICON = { AUTHOR: Pencil, EDITOR: ClipboardCheck }

// Choose a role with cards: the whole card is the radio button (arrow keys move between them, as with any radio group).
//   roles: the role names to offer   value / onChange(role)
export default function RoleCards({ roles, value, onChange }) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="visually-hidden">{t('users.fields.role')}</legend>
      <div className="d-grid gap-2">
        {roles.map((role) => {
          const Icon = ROLE_ICON[role]
          const selected = value === role
          return (
            <label key={role} className={`role-card${selected ? ' is-selected' : ''}`}>
              <input type="radio" name="role" className="form-check-input mt-1 flex-shrink-0" value={role} checked={selected} onChange={() => onChange(role)} />
              <span className="role-card__icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <span className="d-block fw-semibold">{t(`common.roles.${role}`)}</span>
                <span className="d-block small text-muted">{t(`users.create.roles.${role}`)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
