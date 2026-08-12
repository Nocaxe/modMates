import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { signIn, signUp, resetPassword } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault() // prevent refresh
        setError(null)
        setMessage(null)
        setLoading(true)
        try {
            if (mode === 'login') {
                await signIn(email, password)
                onSuccess()
            } else if (mode === 'signup') {
                await signUp(email, password)
                setMessage('Check your email to verify your account')
            } else {
                await resetPassword(email)
                setMessage('Check your email for a password reset link')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    function handleContinueAsGuest() {
        const destination = '/optimiser'
        void navigate(destination)
    }

    return (
        <div className="flex flex-col h-screen justify-center items-center">
            <h1 className="text-2xl font-bold mb-4 text-white">
                {mode === 'login' ? 'Log in' 
                : mode === 'signup' ? 'Sign up' 
                : 'Reset Password'}
            </h1>
            <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-2 w-64">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                {mode !== 'forgot' && (
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                )}
                <button type="submit" disabled={loading} className="bg-green-800 text-white py-2 rounded hover:bg-green-600">
                    {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Sign up' : 'Send reset password link'}
                </button>
            </form>
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
            {mode === 'login' && (
                <p className="text-gray-300">
                    <button onClick={() => setMode('forgot')} className="text-blue-500 hover:underline">
                        Forgot your password?
                    </button>
                </p>
            )}
            <p className="text-gray-300">
                {mode === 'login' && "Don't have an account? "}
                {mode === 'signup' && 'Already have an account? '}
                {mode === 'forgot' && 'Remembered your password? '}
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-blue-500 hover:underline">
                    {mode === 'login' ? 'Sign up here' : 'Log in here'}
                </button>
            </p>
            <p className="text-gray-300">
                or
                <button onClick={handleContinueAsGuest} className="text-blue-500 hover:underline ml-1">
                    Continue as guest
                </button>
            </p>
        </div>
    )
}