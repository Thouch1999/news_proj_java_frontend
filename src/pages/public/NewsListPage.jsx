import NewsBrowser from '../../components/news/NewsBrowser'

// All published news with search and filters, in the URL: /news?keyword=&category=&tag=&from=&to=&page=
export default function NewsListPage() {
  return <NewsBrowser scope={{ kind: 'all' }} />
}
