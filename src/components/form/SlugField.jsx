import { useTranslation } from 'react-i18next'
import FormField from './FormField'
import { slugify } from '../../utils/slug'

// Slug input with a live preview. Empty means "generate from the name" (the backend adds -2, -3 ... if needed).
export default function SlugField({ id, name, slug, onChange, error, editing }) {
  const { t } = useTranslation()
  const preview = slugify(name)
  let help
  if (slug) {
    help = t('common.slugField.asIs')
  } else if (preview) {
    help = t('common.slugField.generated', { slug: preview })
  } else if (name.trim()) {
    help = t('common.slugField.noLatin')
  } else {
    help = t('common.slugField.empty')
  }
  if (editing) {
    help += ` ${t('common.slugField.editingWarning')}`
  }

  return (
    <FormField
      id={id}
      label={editing ? t('common.slugField.label') : t('common.slugField.labelOptional')}
      value={slug}
      onChange={onChange}
      error={error}
      help={help}
      placeholder={preview}
    />
  )
}
