import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { AuthForm } from "./components/AuthForm"


function AppContent() {
  const { session, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!session) return <AuthForm/>

  return (
    <div>
      <div className="flex flex-row gap-4 justify-center bg-gray-800 p-4 rounded">
        <p className="text-white py-2">Logged in as {session.user.email}</p>
        <button onClick={() => void signOut()} className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600">
          Sign out
        </button>
      </div>
      <div>
        {/* TODO: rest of the app here */}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent/>
    </AuthProvider>
  )
}
