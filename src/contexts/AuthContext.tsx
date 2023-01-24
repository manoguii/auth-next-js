import { api } from '@/services/api'
import { useRouter } from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import { createContext, ReactNode, useEffect, useState } from 'react'

interface User {
  email: string
  permissions: string[]
  roles: string[]
}

interface SignInCredentials {
  email: string
  password: string
}

interface IAuthContextData {
  signIn(credentials: SignInCredentials): Promise<void>
  isAuthenticated: boolean
  user: User | undefined
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthContext = createContext({} as IAuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()

  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    const { 'nextAuth.token': token } = parseCookies()

    if (token) {
      api.get('/me').then((response) => {
        const { email, permissions, roles } = response.data

        setUser({ email, permissions, roles })
      })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      })

      const { permissions, roles, token, refreshToken } = response.data

      setCookie(undefined, 'nextAuth.token', token, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      setUser({
        email,
        permissions,
        roles,
      })

      api.defaults.headers.Authorization = `Bearer ${token}`

      router.push('/dashboard')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}
