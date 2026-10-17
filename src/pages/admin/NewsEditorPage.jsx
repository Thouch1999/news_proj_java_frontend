import ArticleEditor from '../../components/news/ArticleEditor'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function NewsEditorPage() {
  return <ArticleEditor area={ARTICLE_AREAS.admin} />
}
