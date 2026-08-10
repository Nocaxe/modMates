import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useProfile } from "../contexts/ProfileContext"

export function Header() {
    const { session, signOut } = useAuth()
    const { displayName } = useProfile()
    const navigate = useNavigate()

    async function onSignOut() {
        await signOut()
        void navigate('/')
    }

    return (
        <div className="flex flex-row gap-4 justify-center bg-gray-800 p-4 rounded">
            <button onClick={() => void navigate('/optimiser')} className="text-white py-2 px-4 rounded hover:bg-gray-700">
                Optimiser
            </button>
            <button onClick={() => void navigate('/groups')} className="text-white py-2 px-4 rounded hover:bg-gray-700">
                Groups
            </button>
            <button onClick={() => void navigate('/profile')} className="text-white py-2 px-4 rounded hover:bg-gray-700">
                Profile
            </button>
            {session && <>
                <p className="text-white py-2 px-4">Logged in as {displayName}</p>
                <button onClick={() => void onSignOut()} className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600">
                    Sign out
                </button>
            </>}
            {!session && <>
                <p className="text-white py-2 px-4">Not logged in</p>
                <button onClick={() => void navigate('/')} className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600">
                    Log in
                </button>
            </>}
        </div>
    )
}