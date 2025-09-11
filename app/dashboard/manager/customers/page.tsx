import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../../lib/db';
import CustomersList from '../../customers/customers-list';

export const metadata = {
  title: 'Müşteri Yönetimi | OLKA Backoffice',
  description: 'Müşterileri yönetin, segmentleri takip edin ve alışveriş geçmişlerini inceleyin',
};

export default async function ManagerCustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Mağaza Müdürü için özel yetki kontrolü
  const roleName = session?.user?.roles?.[0]?.name ?? 'Kullanıcı';
  
  if (roleName !== 'Mağaza Müdürü') {
    redirect('/dashboard');
  }

  // Fetch customers
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignedConsultant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          sales: true,
        },
      },
    },
  });

  // Fetch all users for assignment dropdown
  const users = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: {
              in: ['Satış Danışmanı', 'Mağaza Müdürü']
            }
          }
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müşteri Yönetimi</h1>
          <p className="text-gray-600 mt-1">Tüm müşterileri görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Customers List */}
      <CustomersList 
        initialCustomers={customers} 
        users={users}
        canAssign={true}
        canEdit={true}
        canDelete={true}
        showAssignment={true}
      />
    </div>
  );
}
