import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { AuthForm } from "./components/AuthForm"


function AppContent() {
  const { session, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm/>

  return (
    <div>
      <p>Logged in as {session.user.email}</p>
      <button onClick={() => void signOut()}>Sign out</button>
      {/* TODO: rest of the app here */}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent/>
    </AuthProvider>
  )
}
