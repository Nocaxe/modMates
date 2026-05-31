import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, it, expect } from 'vitest'
import { AuthForm } from '../../components/AuthForm'

const {mockSignIn, mockSignUp} = vi.hoisted(() => ({
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
    })
}))

it('renders login form by default', () => {
    render(<AuthForm />)
    expect(screen.getByRole('heading')).toHaveTextContent('Log in')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
})

it('switches to signup form', async () => {
    render(<AuthForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign up here' }))
    expect(screen.getByRole('heading')).toHaveTextContent('Sign up')
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
})


it('calls signIn with email and password on login button click', async () => {
    mockSignIn.mockResolvedValue(undefined)
    render(<AuthForm />)
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password')
})

it('shows error message when signIn fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))
    render(<AuthForm />)
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
})

it('shows verification message after signup', async () => {
    mockSignUp.mockResolvedValue(undefined)
    render(<AuthForm />)
    await userEvent.click(screen.getByText('Sign up here'))
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByText('Check your email to verify your account')).toBeInTheDocument()
})