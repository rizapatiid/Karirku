import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard (or login if unauthenticated in the future)
  redirect('/login')
}
