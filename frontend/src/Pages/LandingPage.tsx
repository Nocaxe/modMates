import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { AuthForm } from "../components/AuthForm"

export default function LandingPage() {
  const { session, loading } = useAuth() as { session: unknown, loading: boolean }
  const navigate = useNavigate()

  function handleAuthSuccess() {
    void navigate('/optimiser')
  }

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm onSuccess={handleAuthSuccess}/>
}