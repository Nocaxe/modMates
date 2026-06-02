import { useAuth } from "../contexts/AuthContext"
import { getProfile } from "../api/profile"
import type { Profile } from "../api/profile"
import { useEffect, useState } from "react"

export default function ProfilePage() {
    const { session } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)

    useEffect(() => {
        if (!session) return

        getProfile(session.access_token)
            .then(setProfile)
            .catch(console.error)
    }, [session])
    return (
        <div>
            {profile && <p className="text-white">user ID: {profile.user_id}, email: {profile.email}</p>}
        </div>
    )
}