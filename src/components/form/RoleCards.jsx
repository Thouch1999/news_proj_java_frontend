import { Person } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { ROLE_ICON } from '../../constants/roles'

// Choose a role with cards: the whole card is the radio button (arrow keys move between them, as with any radio group).
// Two columns from 768px, one below; the icon has the soft colour of the role (the same as the role badge on the Users page).
//   roles: the role names to offer   value / onChange(role)
export default function RoleCards({ roles, value, onChange }) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="visually-hidden">{t('users.fields.role')}</legend>
      <div className="role-cards">
        {roles.map((role) => {
          const Icon = ROLE_ICON[role] ?? Person
          const selected = value === role
          return (
            <label key={role} className={`role-card${selected ? ' is-selected' : ''}`}>
              <input type="radio" name="role" className="form-check-input mt-1 flex-shrink-0" value={role} checked={selected} onChange={() => onChange(role)} />
              <span className={`role-card__icon role-card__icon--${role}`}>
                <Icon aria-hidden="true" />
              </span>
              <span>
                <span className="d-block fw-semibold">{t(`common.roles.${role}`, { defaultValue: role })}</span>
                <span className="d-block small text-muted">{t(`users.create.roles.${role}`, { defaultValue: '' })}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
