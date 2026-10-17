import FormField from './FormField'
import { slugify } from '../../utils/slug'

// Slug input with a live preview. Empty means "generate from the name" (the backend adds -2, -3 ... if needed).
export default function SlugField({ id, name, slug, onChange, error, editing }) {
  const preview = slugify(name)
  let help
  if (slug) {
    help = 'This slug is used as it is.'
  } else if (preview) {
    help = `Generated from the name: ${preview}`
  } else if (name.trim()) {
    help = 'This name has no Latin letters, so enter a slug yourself (letters a-z, digits and hyphens).'
  } else {
    help = 'Leave empty to generate it from the name.'
  }
  if (editing) {
    help += ' Renaming does not change the slug; changing it breaks existing links.'
  }

  return (
    <FormField
      id={id}
      label={editing ? 'Slug' : 'Slug (optional)'}
      value={slug}
      onChange={onChange}
      error={error}
      help={help}
      placeholder={preview}
    />
  )
}
