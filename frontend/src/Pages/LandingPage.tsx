import { useAuth } from "../contexts/AuthContext"
import { AuthForm } from "../components/AuthForm"

export default function LandingPage() {
  const { session, loading } = useAuth() as { session: unknown, loading: boolean }

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm/>
}