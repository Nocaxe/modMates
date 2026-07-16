import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import AppLayout from './layouts/AppLayout.tsx'
import LandingLayout from './layouts/LandingLayout.tsx'
import { AuthProvider } from "./contexts/AuthContext"
import LandingPage from './Pages/LandingPage.tsx'
import OptimiserPage from './Pages/OptimiserPage.tsx'
import GroupsPage from './Pages/GroupsPage.tsx'
import ProfilePage from './Pages/ProfilePage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

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
      { path: 'groups', element: <ProtectedRoute><GroupsPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> }
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
