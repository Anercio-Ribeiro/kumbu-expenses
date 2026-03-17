import { auth } from './config'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user as { id: string; name: string; email: string }
}

export async function getOptionalUser() {
  const session = await auth()
  return session?.user ?? null
}
