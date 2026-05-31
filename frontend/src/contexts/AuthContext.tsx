import { createContext, use, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null> (null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if existing session exists
        void supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        // Listener for when auth status changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        // Cleanup function to stop listener
        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext value={{
            session,
            user: session?.user ?? null,
            loading,
            signIn, signUp, signOut
        }}>
            {children}
        </AuthContext>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = use(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}