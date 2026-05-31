import { useAuth } from "../contexts/AuthContext"

export function Header() {
    const { session, signOut } = useAuth()

    if (!session) return null

    return (
        <div className="flex flex-row gap-4 justify-center bg-gray-800 p-4 rounded">
        <p className="text-white py-2">Logged in as {session.user.email}</p>
        <button onClick={() => void signOut()} className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600">
            Sign out
        </button>
        </div>
    )
}