import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { updatePassword } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault() // prevent refresh
        setError(null)
        setMessage(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await updatePassword(password)
            setMessage('Password updated successfully. Redirecting to login page...')
            setTimeout(() => navigate('/'), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-screen justify-center items-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Set a new password</h1>
            <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-2 w-64">
                <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="rounded px-1 py-1 bg-white"/>
                <button type="submit" disabled={loading} className="bg-green-800 text-white py-2 rounded hover:bg-green-600">
                    {loading ? 'Please wait...' : 'Update Password'}
                </button>
            </form>
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
        </div>
    )
}
