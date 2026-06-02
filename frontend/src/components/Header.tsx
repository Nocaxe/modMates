import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export function Header() {
    const { session, signOut } = useAuth()
    const navigate = useNavigate()

    if (!session) return null

    async function onSignOut() {
        await signOut()
        void navigate('/')
    }

    return (
        <div className="flex flex-row gap-4 justify-center bg-gray-800 p-4 rounded">
            <p className="text-white py-2">Logged in as {session.user.email}</p>
            <button onClick={() => void onSignOut()} className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600">
                Sign out
            </button>
        </div>
    )
}