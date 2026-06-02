import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import AppLayout from './layouts/AppLayout.tsx'
import LandingLayout from './layouts/LandingLayout.tsx'
import { AuthProvider } from "./contexts/AuthContext"
import LandingPage from './Pages/LandingPage.tsx'
import OptimiserPage from './Pages/OptimiserPage.tsx'
import ProfilePage from './Pages/ProfilePage.tsx'

const router = createBrowserRouter([
  {
    element: <LandingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ]
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'optimiser', element: <OptimiserPage /> },
      { path: 'profile', element: <ProfilePage /> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
