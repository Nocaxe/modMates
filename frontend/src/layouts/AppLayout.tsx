import { Header } from '../components/Header.tsx'
import { Outlet } from 'react-router-dom'


export default function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}