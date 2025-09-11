import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      firstName?: string | null
      lastName?: string | null
      roles?: Array<{
        id: string
        name: string
        description?: string | null
      }>
      permissions?: Array<{
        id: string
        name: string
        description?: string | null
      }>
    }
  }

  interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    email: string
    roles?: Array<{
      id: string
      name: string
      description?: string | null
    }>
    permissions?: Array<{
      id: string
      name: string
      description?: string | null
    }>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    firstName?: string | null
    lastName?: string | null
    roles?: Array<{
      id: string
      name: string
      description?: string | null
    }>
    permissions?: Array<{
      id: string
      name: string
      description?: string | null
    }>
  }
}
