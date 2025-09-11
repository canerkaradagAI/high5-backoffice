
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: undefined,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        // Get user roles and permissions
        const roles = user.userRoles?.map(ur => ur.role) ?? [];
        const permissions = roles?.flatMap(role => 
          role?.rolePermissions?.map(rp => rp.permission) ?? []
        ) ?? [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          phone: user.phone ?? undefined,
          roles: roles?.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description ?? undefined
          })) ?? [],
          permissions: permissions?.map(permission => ({
            id: permission.id,
            name: permission.name,
            description: permission.description ?? undefined
          })) ?? []
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.roles = token.roles as any;
        session.user.permissions = token.permissions as any;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.phone = token.phone as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
