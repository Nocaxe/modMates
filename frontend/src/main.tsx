import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import AppLayout from './layouts/AppLayout.tsx'
import LandingLayout from './layouts/LandingLayout.tsx'
import { AuthProvider } from "./contexts/AuthContext"
import { ProfileProvider } from "./contexts/ProfileContext"
import LandingPage from './Pages/LandingPage.tsx'
import ResetPasswordPage from './Pages/ResetPasswordPage.tsx'
import OptimiserPage from './Pages/OptimiserPage.tsx'
import GuidePage from './Pages/GuidePage.tsx'
import GroupsPage from './Pages/GroupsPage.tsx'
import GroupDetailPage from './Pages/GroupDetailPage.tsx'
import ProfilePage from './Pages/ProfilePage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

const router = createBrowserRouter([
  {
    element: <LandingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/reset-password', element: <ProtectedRoute><ResetPasswordPage /></ProtectedRoute>}
    ]
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'optimiser', element: <OptimiserPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'groups', element: <ProtectedRoute><GroupsPage /></ProtectedRoute> },
      { path: 'groups/:groupId', element: <ProtectedRoute><GroupDetailPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>,
)
