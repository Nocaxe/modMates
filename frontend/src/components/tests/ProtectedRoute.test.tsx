import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import ProtectedRoute from "../ProtectedRoute";
import { render, screen } from "@testing-library/react";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    }
})

it('page shows loading while authenticating', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true })
    render(<MemoryRouter><ProtectedRoute><p>Secret</p></ProtectedRoute></MemoryRouter>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
})

it('redirects to "/" when not authenticated', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false })
    render(
        <MemoryRouter initialEntries={['/profile']}>
            <ProtectedRoute><p>Secret</p></ProtectedRoute>
        </MemoryRouter>
    )
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/')
})

it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ session: { access_token: 'auth' }, loading: false })
    render(<MemoryRouter><ProtectedRoute><p>Secret</p></ProtectedRoute></MemoryRouter>)
    expect(screen.getByText('Secret')).toBeInTheDocument()
})