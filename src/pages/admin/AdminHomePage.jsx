import StaffDashboard from '../../components/news/StaffDashboard'
import { ARTICLE_AREAS } from '../../constants/articleAreas'

export default function AdminHomePage() {
  return <StaffDashboard area={ARTICLE_AREAS.admin} />
}
