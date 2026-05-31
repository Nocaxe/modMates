import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { AuthForm } from "./components/AuthForm"
import { NUSMods } from "./components/NUSMods"
import { Header } from "./components/Header"


function AppContent() {
  const { session, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm/>

  return (
    <div>
      <Header />
      <NUSMods />
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