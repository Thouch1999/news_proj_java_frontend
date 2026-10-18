import CommentModeration from '../../components/news/CommentModeration'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function CommentsPage() {
  return <CommentModeration area={ARTICLE_AREAS.editor} />
}
