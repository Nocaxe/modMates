import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { AuthForm } from "../components/AuthForm"
import { useEffect } from "react"

export default function LandingPage() {
  const { session, loading } = useAuth() as { session: unknown, loading: boolean }
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/optimiser'

  useEffect(() => {
    if (!loading && session) {
        void navigate(from, { replace: true })
    }
  }, [loading, session, navigate, from])

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm onSuccess={() => void navigate(from, { replace: true })}/>
}