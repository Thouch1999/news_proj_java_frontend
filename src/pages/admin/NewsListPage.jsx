import ArticleList from '../../components/news/ArticleList'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function NewsListPage() {
  return <ArticleList area={ARTICLE_AREAS.admin} />
}
