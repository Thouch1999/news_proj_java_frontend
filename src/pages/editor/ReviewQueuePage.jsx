import ReviewQueue from '../../components/news/ReviewQueue'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function ReviewQueuePage() {
  return <ReviewQueue area={ARTICLE_AREAS.editor} />
}
