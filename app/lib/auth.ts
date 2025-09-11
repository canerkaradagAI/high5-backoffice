import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
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
          where: { email: credentials.email },
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

        if (!user || !user.isActive) {
          return null;
        }

        if (user.password) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.userRoles
            .filter(ur => ur.isActive)
            .map(ur => ur.role),
          permissions: user.userRoles
            .filter(ur => ur.isActive)
            .flatMap(ur => ur.role.rolePermissions)
            .filter(rp => rp.isActive)
            .map(rp => rp.permission)
        };
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.permissions = (user as any).permissions;
        token.roles = (user as any).roles;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      // Eğer token'da roles yoksa, veritabanından tekrar çek
      if (!token.roles && token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        });
        if (user) {
          token.roles = user.userRoles
            .filter(ur => ur.isActive)
            .map(ur => ur.role);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.permissions = token.permissions;
        session.user.roles = token.roles;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
};


