import ArticleList from '../../components/news/ArticleList'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function AllArticlesPage() {
  return <ArticleList area={ARTICLE_AREAS.editor} />
}
