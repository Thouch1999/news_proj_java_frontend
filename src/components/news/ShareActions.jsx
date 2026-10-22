import { useEffect, useState } from 'react'
import { Button, Dropdown, Toast, ToastContainer } from 'react-bootstrap'
import { Facebook, Link45deg, Send, Share } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { publicNewsUrl } from '../../constants/routes'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // an older browser or no permission: select the text in a hidden field and copy it
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    let done = false
    try {
      done = document.execCommand('copy')
    } catch {
      done = false
    }
    document.body.removeChild(field)
    return done
  }
}

// On a phone (a touch screen) that has the Web Share API the button opens the phone's own share sheet
const canShareNatively = () => typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches

// Facebook, Telegram and "Copy link" for an article, always with its canonical address (VITE_PUBLIC_SITE_URL + /news/slug),
// so the shared link is the same on every device and Facebook, Telegram ... show the link preview of the backend for it.
// `variant="menu"` is a "Share" dropdown (the article header);
// `variant="row"` shows the three as buttons (after the text). Share links open in a new tab; "Copy link" shows a toast.
export default function ShareActions({ title, slug, variant = 'menu' }) {
  const { t } = useTranslation()
  const articleUrl = () => publicNewsUrl(slug)
  const [copied, setCopied] = useState(null) // true: copied, false: could not copy

  useEffect(() => {
    if (copied === null) return undefined
    const timer = setTimeout(() => setCopied(null), 3500)
    return () => clearTimeout(timer)
  }, [copied])

  const links = () => {
    const url = encodeURIComponent(articleUrl())
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(title)}`,
    }
  }
  const copy = async () => setCopied(await copyText(articleUrl()))
  const share = async () => {
    try {
      await navigator.share({ title, url: articleUrl() })
    } catch {
      // the user closed the share sheet
    }
  }

  const toast = (
    <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 2000 }}>
      <Toast bg={copied === false ? 'danger' : 'success'} show={copied !== null} onClose={() => setCopied(null)}>
        <Toast.Body className="text-white" role="status">
          {copied === false ? t('public.share.copyFailed') : t('public.share.copied')}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  )

  if (variant === 'row') {
    const { facebook, telegram } = links()
    return (
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className="fw-semibold me-1">{t('public.share.label')}</span>
        <Button as="a" href={facebook} target="_blank" rel="noopener noreferrer" variant="outline-secondary" size="sm">
          <Facebook className="me-1" aria-hidden="true" />
          Facebook
        </Button>
        <Button as="a" href={telegram} target="_blank" rel="noopener noreferrer" variant="outline-secondary" size="sm">
          <Send className="me-1" aria-hidden="true" />
          Telegram
        </Button>
        <Button type="button" variant="outline-secondary" size="sm" onClick={copy}>
          <Link45deg className="me-1" aria-hidden="true" />
          {t('public.share.copy')}
        </Button>
        {toast}
      </div>
    )
  }

  if (canShareNatively()) {
    return (
      <>
        <Button type="button" variant="outline-secondary" onClick={share}>
          <Share className="me-2" aria-hidden="true" />
          {t('public.share.label')}
        </Button>
      </>
    )
  }

  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle variant="outline-secondary" id="share-menu">
          <Share className="me-2" aria-hidden="true" />
          {t('public.share.label')}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* the links are built when the menu is open, so they have the current address */}
          <Dropdown.Item href={links().facebook} target="_blank" rel="noopener noreferrer">
            <Facebook className="me-2" aria-hidden="true" />
            Facebook
          </Dropdown.Item>
          <Dropdown.Item href={links().telegram} target="_blank" rel="noopener noreferrer">
            <Send className="me-2" aria-hidden="true" />
            Telegram
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as="button" type="button" onClick={copy}>
            <Link45deg className="me-2" aria-hidden="true" />
            {t('public.share.copy')}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      {toast}
    </>
  )
}
