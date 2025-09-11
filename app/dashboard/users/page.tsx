
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import UsersList from './users-list';

export const metadata = {
  title: 'Kullanıcı Yönetimi | OLKA Backoffice',
  description: 'Kullanıcıları yönetin, roller atayın ve yetkileri düzenleyin',
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check permissions
  const userPermissions = session?.user?.permissions ?? [];
  const hasPermission = userPermissions?.some(p => p?.name === 'Kullanıcı Yönetimi');
  
  if (!hasPermission) {
    redirect('/dashboard');
  }

  // Fetch users with roles
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Fetch available roles
  const roles = await prisma.role.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold olka-text-dark">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-2">
            Kullanıcıları yönetin, roller atayın ve yetkileri düzenleyin
          </p>
        </div>
      </div>

      {/* Users List Component */}
      <UsersList initialUsers={users} availableRoles={roles} />
    </div>
  );
}
