import { useState } from 'react'
import { Button, Col, Modal, Row } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { mediaUrl } from '../../utils/mediaUrl'

// The images of an article (shown from two images): a grid of thumbnails; a click opens the picture large, with its caption and arrows.
export default function ImageGallery({ images }) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState(null)
  if (!images || images.length < 2) {
    return null // a single image is the hero of the article
  }
  const open = openIndex === null ? null : images[openIndex]
  const move = (step) => setOpenIndex((index) => (index + step + images.length) % images.length)

  return (
    <section className="my-4" aria-label={t('public.gallery.label')}>
      <h2 className="h5 mb-3">{t('public.gallery.title')}</h2>
      <Row xs={2} md={3} className="g-2">
        {images.map((image, index) => (
          <Col key={image.id}>
            <button type="button" className="gallery-item w-100 p-0 border-0 bg-transparent text-start" onClick={() => setOpenIndex(index)}>
              <div className="ratio ratio-4x3 bg-body-secondary rounded overflow-hidden">
                <img src={mediaUrl(image.url)} alt={image.caption ?? ''} loading="lazy" className="object-fit-cover" />
              </div>
              {image.caption && <span className="d-block small text-muted mt-1 news-clamp-2">{image.caption}</span>}
            </button>
          </Col>
        ))}
      </Row>

      <Modal show={open !== null} onHide={() => setOpenIndex(null)} size="lg" centered>
        <Modal.Body className="text-center">
          {open && <img src={mediaUrl(open.url)} alt={open.caption ?? ''} className="img-fluid rounded" />}
          {open?.caption && <p className="mt-2 mb-0">{open.caption}</p>}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="outline-secondary" onClick={() => move(-1)} disabled={images.length < 2} aria-label={t('public.gallery.previous')}>
            <ChevronLeft />
          </Button>
          <span className="text-muted small">
            {openIndex === null ? '' : `${openIndex + 1} / ${images.length}`}
          </span>
          <Button variant="outline-secondary" onClick={() => move(1)} disabled={images.length < 2} aria-label={t('public.gallery.next')}>
            <ChevronRight />
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  )
}
