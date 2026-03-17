import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { getUserByEmail } from '@/lib/db/queries'
import { loginSchema } from '@/lib/validators'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', newUser: '/register' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Palavra-passe', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await getUserByEmail(parsed.data.email)
        if (!user) return null

        const isValid = await compare(parsed.data.password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
})
