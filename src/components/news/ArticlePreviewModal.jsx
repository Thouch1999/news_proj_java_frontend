import { Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ArticlePreview from './ArticlePreview'

// The article as readers would see it, with the values that are in the form now (saved or not)
export default function ArticlePreviewModal({ show, article, onClose }) {
  const { t } = useTranslation()
  return (
    <Modal show={show} onHide={onClose} size="xl" scrollable centered>
      <Modal.Header closeButton closeLabel={t('common.actions.close')}>
        <Modal.Title className="h5">{t('news.editor.preview')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{article && <ArticlePreview article={article} />}</Modal.Body>
    </Modal>
  )
}
