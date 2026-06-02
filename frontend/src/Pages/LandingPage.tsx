import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { AuthForm } from "../components/AuthForm"
import { useEffect } from "react"

export default function LandingPage() {
  const { session, loading } = useAuth() as { session: unknown, loading: boolean }
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && session) {
        void navigate('/optimiser', { replace: true })
    }
  }, [loading, session, navigate])

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm onSuccess={() => void navigate('/optimiser')}/>
}