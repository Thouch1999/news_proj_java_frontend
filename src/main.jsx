import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './assets/styles/main.scss'
import './i18n'
import AuthProvider from './context/AuthProvider'
import BookmarkProvider from './context/BookmarkProvider'
import NotificationProvider from './context/NotificationProvider'
import SettingsProvider from './context/SettingsProvider'
import AppRoutes from './routes/AppRoutes'

// A data router (instead of <BrowserRouter>) is needed for useBlocker, which warns before leaving a page with
// unsaved changes. One catch-all route renders the existing <Routes> in AppRoutes unchanged.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <SettingsProvider>
        <AuthProvider>
          <BookmarkProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </BookmarkProvider>
        </AuthProvider>
      </SettingsProvider>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
