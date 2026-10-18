import { CircleHalf, Moon, Sun, Translate } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../../i18n'
import { useTheme } from '../../hooks/useTheme'

const LANGUAGE_NAMES = { en: 'English', km: 'ខ្មែរ' }
const THEMES = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: CircleHalf },
]

// One choice as a card; the radio inside is what the keyboard and screen readers use
function ChoiceCard({ name, value, checked, icon: Icon, label, lang, onChange }) {
  return (
    <label className="pref-card">
      <input type="radio" className="visually-hidden" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span className="pref-card__body">
        <Icon aria-hidden="true" />
        <span lang={lang}>{label}</span>
      </span>
    </label>
  )
}

// The "Preferences" tab: language and colour mode, saved on this device (localStorage) and applied at once, the same
// way as the header controls (which follow because they share the same state).
export default function PreferencesPane() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useTheme()
  const language = LANGUAGES.includes(i18n.language) ? i18n.language : 'en'

  return (
    <div>
      <fieldset className="mb-4">
        <legend className="h6">{t('dashboard.profile.preferences.language')}</legend>
        <div className="pref-cards">
          {LANGUAGES.map((value) => (
            <ChoiceCard key={value} name="pref-language" value={value} checked={language === value} icon={Translate} label={LANGUAGE_NAMES[value]} lang={value} onChange={setLanguage} />
          ))}
        </div>
      </fieldset>
      <fieldset className="mb-3">
        <legend className="h6">{t('dashboard.profile.preferences.theme')}</legend>
        <div className="pref-cards">
          {THEMES.map(({ value, icon }) => (
            <ChoiceCard key={value} name="pref-theme" value={value} checked={mode === value} icon={icon} label={t(`common.theme.${value}`)} onChange={setMode} />
          ))}
        </div>
      </fieldset>
      <p className="small text-muted mb-0">{t('dashboard.profile.preferences.saved')}</p>
    </div>
  )
}
