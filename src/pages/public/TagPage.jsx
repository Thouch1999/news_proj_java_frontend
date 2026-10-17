import TermNewsPage from '../../components/news/TermNewsPage'
import * as tagService from '../../services/tagService'

export default function TagPage() {
  return <TermNewsPage kind="tag" loadTerm={tagService.getTagBySlug} />
}
