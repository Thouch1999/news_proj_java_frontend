import ProfileView from '../../components/profile/ProfileView'

// The profile of a reader (any logged-in user), shown in the public layout: the same card, tabs and password form as
// the dashboard.
export default function ProfilePage() {
  return <ProfileView area="public" />
}
