import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function AuthForm() {
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
            } else {
                await signUp(email, password)
                setMessage('Check your email to verify your account')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        }
    }

    return (
        <div>
            <h1>{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
            <form onSubmit={e => void handleSubmit(e)}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p>{message}</p>}
            <p>{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                    {mode === 'login' ? 'Sign up here' : 'Log in here'}
                </button>
            </p>
        </div>
    )
}