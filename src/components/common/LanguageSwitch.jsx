import { Dropdown } from 'react-bootstrap'
import { Translate } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../../i18n'

// The language names are written in their own language, so a visitor can always find theirs.
const NAMES = { en: 'English', km: 'ខ្មែរ' }

// A globe button with the languages in a menu. `variant` is the Bootstrap button variant of the button.
export default function LanguageSwitch({ variant = 'outline-secondary' }) {
  const { t, i18n } = useTranslation()
  const current = LANGUAGES.includes(i18n.language) ? i18n.language : 'en'

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant={variant} size="sm" className="language-switch d-flex align-items-center gap-1" aria-label={t('common.language.label', { name: NAMES[current] })}>
        <Translate aria-hidden="true" />
        <span>{NAMES[current]}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {LANGUAGES.map((language) => (
          <Dropdown.Item key={language} lang={language} active={language === current} aria-current={language === current} onClick={() => setLanguage(language)}>
            {NAMES[language]}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
