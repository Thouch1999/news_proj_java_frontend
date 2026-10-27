import { useCallback, useEffect, useRef, useState } from 'react'
import { MEDIA_BY_PLACEMENT, MEDIA_IMAGE, MEDIA_YOUTUBE, youtubeLink } from '../constants/promo'
import i18n from '../i18n'
import * as partnerService from '../services/partnerService'
import { errorMessage } from '../utils/errorMessage'
import { readVideoSeconds, validatePartnerImage, validatePartnerVideo } from '../utils/partnerValidation'

// The video and YouTube choices of the sponsor form, for the places that take them (the sidebar and the popup). A chosen file
// is only kept in the page (an object URL for the preview) and is uploaded when the sponsor is saved; the YouTube link is
// checked by the backend (partnerService.checkYoutube) without saving anything.
//   media[place] = { type (the chosen media type), video: { file, preview, seconds, problem }, poster: { file, preview, problem },
//     url (the YouTube link as typed), check: { videoId, thumbnailUrl, url } | null (the link that passed the check),
//     checking, problem (of the link), resetPoster (go back to the YouTube thumbnail) }
// The picture of a chosen IMAGE stays in the page state `images` (PartnerEditorPage).

const PLACES = Object.keys(MEDIA_BY_PLACEMENT)

export const youtubeThumbnail = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

const fileSlot = () => ({ file: null, preview: '', problem: '' })

function initialState(creative) {
  const tube = creative?.mediaType === MEDIA_YOUTUBE
  return {
    type: creative?.mediaType ?? MEDIA_IMAGE,
    video: { ...fileSlot(), seconds: null },
    poster: fileSlot(),
    url: tube ? youtubeLink(creative.youtubeId) : '',
    check: tube ? { videoId: creative.youtubeId, thumbnailUrl: youtubeThumbnail(creative.youtubeId), url: youtubeLink(creative.youtubeId) } : null,
    checking: false,
    problem: '',
    resetPoster: false,
  }
}

const initialAll = (partner) => Object.fromEntries(PLACES.map((place) => [place, initialState(partner?.creatives.find((creative) => creative.placement === place))]))

export function usePartnerMedia(partner, limits) {
  const [media, setMedia] = useState(() => initialAll(partner))
  const urls = useRef(new Set()) // the object addresses of the chosen files: freed when they are replaced and on leaving

  useEffect(() => {
    const held = urls.current
    return () => held.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const hold = (file) => {
    const url = URL.createObjectURL(file)
    urls.current.add(url)
    return url
  }
  const free = (url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urls.current.delete(url)
  }
  const patch = useCallback((place, change) => {
    setMedia((current) => ({ ...current, [place]: { ...current[place], ...(typeof change === 'function' ? change(current[place]) : change) } }))
  }, [])

  const setType = (place, type) => patch(place, { type, problem: '' })

  const chooseVideo = (place, file) => {
    const problem = validatePartnerVideo(file, limits)
    patch(place, (state) => {
      free(state.video.preview)
      return { video: { file: null, preview: '', seconds: null, problem } }
    })
    if (problem) return
    const preview = hold(file)
    patch(place, { video: { file, preview, seconds: null, problem: '' } })
    // the browser reads the length: a video that is clearly too long is refused here (the backend checks it again)
    readVideoSeconds(preview).then((seconds) => {
      patch(place, (state) => {
        if (state.video.preview !== preview) return {}
        if (seconds !== null && seconds > limits.videoMaxSeconds + 0.5) {
          free(preview)
          return { video: { file: null, preview: '', seconds, problem: i18n.t('dashboard.partners.media.errors.videoTooLong', { seconds: Math.round(seconds), max: limits.videoMaxSeconds }) } }
        }
        return { video: { ...state.video, seconds } }
      })
    })
  }
  const clearVideo = (place) =>
    patch(place, (state) => {
      free(state.video.preview)
      return { video: { ...fileSlot(), seconds: null } }
    })

  const choosePoster = (place, file) => {
    const problem = validatePartnerImage(file)
    patch(place, (state) => {
      free(state.poster.preview)
      return { poster: { file: null, preview: '', problem }, resetPoster: false }
    })
    if (problem) return
    patch(place, { poster: { file, preview: hold(file), problem: '' } })
  }
  const clearPoster = (place) =>
    patch(place, (state) => {
      free(state.poster.preview)
      return { poster: fileSlot() }
    })
  // YouTube: forget the uploaded poster and use the thumbnail of the video again
  const useThumbnail = (place) =>
    patch(place, (state) => {
      free(state.poster.preview)
      return { poster: fileSlot(), resetPoster: true }
    })

  const setUrl = (place, url) =>
    patch(place, (state) => ({ url, problem: '', check: state.check && state.check.url === url.trim() ? state.check : null }))

  const checkUrl = async (place, url) => {
    const link = url.trim()
    if (!link) {
      patch(place, { problem: i18n.t('dashboard.partners.errors.youtubeRequired'), check: null })
      return
    }
    patch(place, { checking: true, problem: '' })
    try {
      const found = await partnerService.checkYoutube(link)
      patch(place, { checking: false, problem: '', check: { videoId: found.videoId, thumbnailUrl: found.thumbnailUrl, url: link } })
    } catch (error) {
      patch(place, { checking: false, check: null, problem: error?.details?.youtubeUrl ?? errorMessage(error) })
    }
  }

  // after a save: everything starts again from the saved sponsor
  const reset = (saved) => {
    urls.current.forEach((url) => URL.revokeObjectURL(url))
    urls.current.clear()
    setMedia(initialAll(saved))
  }

  // whether a place has a change that is not saved (a type, a file, a link or the thumbnail choice)
  const pending = (place, savedCreative) => {
    const state = media[place]
    const savedType = savedCreative?.mediaType ?? MEDIA_IMAGE
    const savedLink = savedCreative?.mediaType === MEDIA_YOUTUBE ? youtubeLink(savedCreative.youtubeId) : ''
    return state.type !== savedType || Boolean(state.video.file) || Boolean(state.poster.file) || state.resetPoster || (state.type === MEDIA_YOUTUBE && state.url.trim() !== savedLink)
  }

  return { media, setType, chooseVideo, clearVideo, choosePoster, clearPoster, useThumbnail, setUrl, checkUrl, reset, pending }
}
