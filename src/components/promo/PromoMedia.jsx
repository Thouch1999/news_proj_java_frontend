import { useEffect, useRef, useState } from 'react'
import { PlayFill, VolumeMuteFill, VolumeUpFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { PLACEMENT_POPUP, VIEW_RATIO, VIDEO_COMPLETE_RATIO } from '../../constants/promo'
import { useAutoplayAllowed } from '../../hooks/useAutoplayAllowed'
import { usePromoVideoEvents } from '../../hooks/usePromoVideoEvents'
import { mediaUrl } from '../../utils/mediaUrl'
import { youtubeIdOf } from '../../utils/promo'

// The media of a promo: a picture, a video file or a YouTube video. Like the other promo components these only draw; the
// click link is added around the text by PromoParts. With `preview` (the admin form) nothing is counted and nothing loads
// from YouTube: a video file is a muted loop and a YouTube video is its poster with a play icon.
//   promo: { id, imageUrl (the picture, or the poster of a video), videoUrl, youtubeId, mediaType, width, height, altText, title }
//   placement: ARTICLE_SIDEBAR or ARTICLE_POPUP (a video file works in both, YouTube only in the popup)

const YOUTUBE_ORIGIN = 'https://www.youtube-nocookie.com'

// A fixed shape so nothing jumps while the media loads: 16:9 for a video file and YouTube, the design size of the placement
// (sidebar 6:5, popup 3:2) for a picture
const boxStyle = (promo) => ({ aspectRatio: promo.ratio ?? (promo.mediaType === 'VIDEO_FILE' || promo.mediaType === 'YOUTUBE' ? '16 / 9' : `${promo.width} / ${promo.height}`) })

// The "Sponsored" label sits on the media (top left, a dark pill), so a promo has no separate row for it and no frame
export function MediaFrame({ label, children }) {
  return (
    <span className="promo-frame">
      {children}
      {label && <span className="promo-label">{label}</span>}
    </span>
  )
}

// What YouTube makes for a video: hqdefault.jpg is 4:3 with black bars, so the page asks for maxresdefault.jpg (16:9) and falls
// back to hqdefault.jpg when there is none. An uploaded poster (any other address) is used as it is. Always cropped by the box.
const YOUTUBE_THUMBNAIL = /^https:\/\/i\.ytimg\.com\/vi\/([A-Za-z0-9_-]{11})\/hqdefault\.jpg$/
function PosterImage({ promo, loading }) {
  const [failed, setFailed] = useState(false)
  const thumbnail = YOUTUBE_THUMBNAIL.exec(promo.imageUrl ?? '')
  const maxres = Boolean(thumbnail) && !failed
  const src = maxres ? `https://i.ytimg.com/vi/${thumbnail[1]}/maxresdefault.jpg` : mediaUrl(promo.imageUrl)
  return <img src={src} width={promo.width} height={promo.height} alt={promo.altText || ''} loading={loading} decoding="async" onError={maxres ? () => setFailed(true) : undefined} />
}

// the picture in a box of fixed shape: the page does not jump while the image loads
export function Picture({ promo, className = '' }) {
  return (
    <span className={`promo-media ${className}`} style={boxStyle(promo)}>
      {promo.imageUrl ? <img src={mediaUrl(promo.imageUrl)} width={promo.width} height={promo.height} alt={promo.altText || ''} loading="lazy" decoding="async" /> : null}
    </span>
  )
}

// the poster with a play icon on it (YouTube before it is played, and in the admin preview)
export function PosterPlay({ promo, children }) {
  return (
    <span className="promo-media promo-media--poster" style={boxStyle(promo)}>
      {promo.imageUrl ? <PosterImage key={promo.imageUrl} promo={promo} /> : null}
      {children ?? (
        <span className="promo-media__play promo-media__play--static" aria-hidden="true">
          <PlayFill size={36} />
        </span>
      )}
    </span>
  )
}

function PreviewVideo({ promo }) {
  return (
    <span className="promo-media" style={boxStyle(promo)}>
      <video src={mediaUrl(promo.videoUrl)} poster={promo.imageUrl ? mediaUrl(promo.imageUrl) : undefined} muted loop autoPlay playsInline preload="metadata" aria-label={promo.altText || promo.title || undefined} />
    </span>
  )
}

// A video file: starts only while at least half of it is visible and the tab is in front, pauses when it is not. Without
// autoplay (a phone, saved data, reduced motion) the poster has a play button and a tap plays it, with sound and controls.
function LiveVideo({ promo, placement, pageView }) {
  const { t } = useTranslation()
  const autoplay = useAutoplayAllowed()
  const video = useRef(null)
  const inView = useRef(false)
  const [started, setStarted] = useState(false) // the reader tapped play
  const [muted, setMuted] = useState(true)
  const { reportPlay, reportComplete } = usePromoVideoEvents(promo.id, placement, pageView)

  useEffect(() => {
    const element = video.current
    if (!element || typeof IntersectionObserver === 'undefined') return undefined
    const sync = () => {
      if (inView.current && document.visibilityState === 'visible') {
        if (autoplay) element.play().catch(() => {})
      } else {
        element.pause()
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting && entry.intersectionRatio >= VIEW_RATIO
        sync()
      },
      { threshold: [0, VIEW_RATIO, 1] },
    )
    observer.observe(element)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [autoplay])

  const start = () => {
    const element = video.current
    if (!element) return
    setStarted(true)
    setMuted(false)
    element.muted = false
    element.play().catch(() => {})
  }
  const toggleSound = () => {
    const element = video.current
    if (!element) return
    element.muted = !element.muted
    setMuted(element.muted)
  }
  const progress = (event) => {
    const element = event.currentTarget
    if (element.duration > 0 && element.currentTime / element.duration >= VIDEO_COMPLETE_RATIO) reportComplete()
  }

  return (
    <span className="promo-media promo-media--video" style={boxStyle(promo)}>
      <video
        ref={video}
        src={mediaUrl(promo.videoUrl)}
        poster={promo.imageUrl ? mediaUrl(promo.imageUrl) : undefined}
        muted={muted}
        loop
        playsInline
        preload="none"
        controls={!autoplay && started}
        aria-label={promo.altText || promo.title || undefined}
        onPlaying={reportPlay}
        onTimeUpdate={progress}
        onEnded={reportComplete}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      />
      {!autoplay && !started && (
        <button type="button" className="promo-media__play" aria-label={t('public.promo.play')} onClick={start}>
          <PlayFill size={36} aria-hidden="true" />
        </button>
      )}
      {autoplay && (
        <button type="button" className="promo-media__sound" aria-label={muted ? t('public.promo.unmute') : t('public.promo.mute')} aria-pressed={!muted} onClick={toggleSound}>
          {muted ? <VolumeMuteFill size={18} aria-hidden="true" /> : <VolumeUpFill size={18} aria-hidden="true" />}
        </button>
      )}
    </span>
  )
}

// A YouTube video in the popup. The poster comes first; the iframe of youtube-nocookie.com exists only while this component
// is on the page, that is while the popup is open (closing the popup removes it, which stops the video). It loads at once
// (muted) where autoplay is allowed, else on a tap. Play and end are read from the player with its postMessage protocol,
// without loading the YouTube script.
function LiveYoutube({ promo, placement, pageView }) {
  const { t } = useTranslation()
  const autoplay = useAutoplayAllowed()
  const id = youtubeIdOf(promo)
  const [tapped, setTapped] = useState(false)
  const frame = useRef(null)
  const loaded = Boolean(id) && (autoplay || tapped)
  const { reportPlay, reportComplete } = usePromoVideoEvents(promo.id, placement, pageView)

  useEffect(() => {
    if (!loaded) return undefined
    const onMessage = (event) => {
      if (event.origin !== YOUTUBE_ORIGIN || event.source !== frame.current?.contentWindow) return
      let data = event.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }
      if (!data || typeof data !== 'object') return
      const state = data.event === 'onStateChange' ? data.info : data.event === 'infoDelivery' ? data.info?.playerState : undefined
      if (state === 1) reportPlay()
      else if (state === 0) reportComplete()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [loaded, reportPlay, reportComplete])

  if (!loaded) {
    return (
      <PosterPlay promo={promo}>
        {id ? (
          <button type="button" className="promo-media__play" aria-label={t('public.promo.play')} onClick={() => setTapped(true)}>
            <PlayFill size={36} aria-hidden="true" />
          </button>
        ) : (
          false
        )}
      </PosterPlay>
    )
  }

  const address = new URL(`${YOUTUBE_ORIGIN}/embed/${id}`)
  address.search = new URLSearchParams({
    autoplay: '1',
    mute: autoplay ? '1' : '0', // a tap is a gesture that allows sound
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    origin: window.location.origin,
  }).toString()
  return (
    <span className="promo-media promo-media--embed" style={boxStyle(promo)}>
      <iframe
        ref={frame}
        src={address.toString()}
        title={promo.title || t('public.promo.videoLabel')}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YOUTUBE_ORIGIN)}
      />
    </span>
  )
}

// The media of a promo in a placement. `pageView` (the id of the page view) limits the video events to one per page view.
export function PromoMedia({ promo, placement, preview = false, pageView }) {
  if (promo.mediaType === 'VIDEO_FILE' && promo.videoUrl) {
    return preview ? <PreviewVideo promo={promo} /> : <LiveVideo promo={promo} placement={placement} pageView={pageView} />
  }
  if (promo.mediaType === 'YOUTUBE' && placement === PLACEMENT_POPUP) {
    return preview ? <PosterPlay promo={promo} /> : <LiveYoutube promo={promo} placement={placement} pageView={pageView} />
  }
  return <Picture promo={promo} />
}
