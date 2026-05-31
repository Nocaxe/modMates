import { render, act } from '@testing-library/react'
import { vi, it, expect } from 'vitest'
import type { AuthContextType } from '../../contexts/AuthContext'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

// Mock supabase client
const { mockSignIn, mockSignUp, mockSignOut, mockGetSession, mockOnAuthStateChange } = vi.hoisted(() => ({
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
    mockSignOut: vi.fn(),
    mockGetSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    mockOnAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
}))

vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: mockGetSession,
            onAuthStateChange: mockOnAuthStateChange,
            signInWithPassword: mockSignIn,
            signUp: mockSignUp,
            signOut: mockSignOut,
        }
    }
}))

// Helpers that capture the context value so tests can inspect it
let capturedAuth: AuthContextType

function TestConsumer() {
    // eslint-disable-next-line
    capturedAuth = useAuth()
    return null
}

function renderWithProvider() {
    render(
        <AuthProvider>
            <TestConsumer />
        </AuthProvider>
    )
}

// Tests
it('loading state changes to false after session loads', async () => {
    renderWithProvider()
    await act(() => Promise.resolve()) // Wait for useEffect to run
    expect(capturedAuth.loading).toBe(false)
    expect(capturedAuth.user).toBeNull()
    expect(capturedAuth.session).toBeNull()
})

it('signIn calls supabase with correct args', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    renderWithProvider()
    await act(async () => {
        await capturedAuth.signIn('test@example.com', 'password')
    })

    expect(mockSignIn).toHaveBeenCalledWith({ 
        email: 'test@example.com', 
        password: 'password'
    })
})

it('signIn throws error when supabase returns error', async () => {
    const fakeError = new Error('Invalid credentials')
    mockSignIn.mockResolvedValue({ error: fakeError })
    renderWithProvider()
    await act(async () => {}) // Wait for initial load
    await expect(capturedAuth.signIn('test@example.com', 'password')).rejects.toThrow('Invalid credentials')
})

it('signUp calls supabase with correct args', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    renderWithProvider()
    await act(async () => {}) // Wait for initial load
    await act(async () => {
        await capturedAuth.signUp('test@example.com', 'password')
    })
    expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
    })
})