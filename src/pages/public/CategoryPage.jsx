import TermNewsPage from '../../components/news/TermNewsPage'
import * as categoryService from '../../services/categoryService'

export default function CategoryPage() {
  return <TermNewsPage kind="category" loadTerm={categoryService.getCategoryBySlug} />
}
