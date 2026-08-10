import { createContext, use, useCallback, useEffect, useState } from 'react'
import { getProfile } from '../api/profile'
import type { Profile } from '../api/profile'
import { useAuth } from './AuthContext'

interface ProfileContextType {
    profile: Profile | null
    displayName: string
    rawDisplayName: string
    refreshProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)

    const refreshProfile = useCallback(() => {
        if (!session) {
            setProfile(null)
            return
        }
        getProfile(session.access_token)
            .then(setProfile)
            .catch(console.error)
    }, [session])

    useEffect(() => {
        refreshProfile()
    }, [refreshProfile])

    const displayName: string = profile?.display_name ?? profile?.email ?? ''
    const rawDisplayName: string = profile?.display_name ?? ''

    return (
        <ProfileContext value={{ profile, displayName, rawDisplayName, refreshProfile }}>
            {children}
        </ProfileContext>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
    const context = use(ProfileContext)
    if (!context) throw new Error('useProfile must be used within ProfileProvider')
    return context
}
