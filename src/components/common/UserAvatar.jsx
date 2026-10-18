import { useState } from 'react'
import { mediaUrl } from '../../utils/mediaUrl'
import { PersonCircle } from 'react-bootstrap-icons'

// The profile picture of the logged-in user (an image URL, see the profile form). Without a picture, or when the URL
// does not load, it shows the first letter of the name (`fallback="initial"`, in the element given by `className`) or a
// person icon (`fallback="icon"`).
export default function UserAvatar({ src, name = '', size = 24, fallback = 'icon', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (src && failedSrc !== src) {
    return <img src={mediaUrl(src)} alt="" width={size} height={size} className={`rounded-circle object-fit-cover ${className}`} style={{ width: size, height: size }} onError={() => setFailedSrc(src)} />
  }
  if (fallback === 'initial') {
    return <span className={className}>{name.charAt(0).toUpperCase() || '?'}</span>
  }
  return <PersonCircle size={size} aria-hidden="true" />
}
