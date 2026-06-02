import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault() // prevent refresh
        setError(null)
        setMessage(null)
        try {
            if (mode === 'login') {
                await signIn(email, password)
                onSuccess()
            } else {
                await signUp(email, password)
                setMessage('Check your email to verify your account')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        }
    }

    return (
        <div className="flex flex-col h-screen justify-center items-center">
            <h1 className="text-2xl font-bold mb-4 text-white">{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
            <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-2 w-64">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                <button type="submit" className="bg-green-800 text-white py-2 rounded hover:bg-green-600">
                    {mode === 'login' ? 'Log in' : 'Sign up'}
                </button>
            </form>
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
            <p className="text-gray-300">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-blue-500 hover:underline">
                    {mode === 'login' ? 'Sign up here' : 'Log in here'}
                </button>
            </p>
        </div>
    )
}