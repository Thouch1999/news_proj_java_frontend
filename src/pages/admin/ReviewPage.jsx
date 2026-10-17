import ArticleReview from '../../components/news/ArticleReview'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function ReviewPage() {
  return <ArticleReview area={ARTICLE_AREAS.admin} />
}
