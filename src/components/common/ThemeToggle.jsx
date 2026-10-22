import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { CircleHalf, Moon, Sun } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'

const OPTIONS = [
  { mode: 'light', icon: Sun },
  { mode: 'dark', icon: Moon },
  { mode: 'system', icon: CircleHalf },
]

// A sun/moon button with the three colour modes in a menu. `variant` is the Bootstrap button variant of the button.
export default function ThemeToggle({ variant = 'outline-secondary' }) {
  const { t } = useTranslation()
  const { mode, theme, setMode } = useTheme()
  const Icon = theme === 'dark' ? Moon : Sun
  const label = t(`common.theme.${mode}`)

  return (
    <Dropdown align="end">
      <OverlayTrigger placement="bottom" overlay={<Tooltip id="theme-tooltip">{t('common.theme.label', { name: label })}</Tooltip>}>
        <Dropdown.Toggle variant={variant} size="sm" className="theme-toggle header-control" aria-label={t('common.theme.label', { name: label })}>
          <Icon aria-hidden="true" />
        </Dropdown.Toggle>
      </OverlayTrigger>
      <Dropdown.Menu>
        {OPTIONS.map(({ mode: value, icon: OptionIcon }) => (
          <Dropdown.Item key={value} active={value === mode} aria-current={value === mode} onClick={() => setMode(value)}>
            <OptionIcon className="me-2" aria-hidden="true" />
            {t(`common.theme.${value}`)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
