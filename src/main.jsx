import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './assets/styles/main.scss'
import AuthProvider from './context/AuthProvider'
import AppRoutes from './routes/AppRoutes'

// A data router (instead of <BrowserRouter>) is needed for useBlocker, which warns before leaving a page with
// unsaved changes. One catch-all route renders the existing <Routes> in AppRoutes unchanged.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
