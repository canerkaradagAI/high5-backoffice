
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/db';
import CustomersList from './customers-list';

export const metadata = {
  title: 'Müşteri Yönetimi | High5 Backoffice',
  description: 'Müşterileri yönetin, segmentleri takip edin ve alışveriş geçmişlerini inceleyin',
};

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check permissions and roles
  const userPermissions = session?.user?.permissions ?? [];
  const userRoles = session?.user?.roles ?? [];
  
  const hasPermission = userPermissions?.some(p => p?.name === 'Müşteri Görüntüleme');
  const hasRole = userRoles?.some((role: any) => 
    role.name === 'Mağaza Müdürü' || role.name === 'Satış Danışmanı'
  );
  
  if (!hasPermission && !hasRole) {
    redirect('/dashboard');
  }

  // Fetch customers with latest sale
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
      sales: {
        orderBy: { invoiceDate: 'desc' },
        take: 1,
        select: { id: true, amount: true, invoiceDate: true, title: true }
      },
      _count: {
        select: {
          sales: true,
        },
      },
    },
  });

  // Compute totals from Sale to ensure UI amounts reflect real history
  const salesAgg = await prisma.sale.groupBy({
    by: ['customerId'],
    _sum: { amount: true },
    _count: { _all: true },
  });
  const customerIdToTotals = new Map<string, { totalSpent: number; totalOrders: number }>();
  for (const row of salesAgg) {
    customerIdToTotals.set(row.customerId, {
      totalSpent: Number(row._sum.amount || 0),
      totalOrders: Number(row._count._all || 0),
    });
  }

  const customersWithComputedTotals = customers.map((c) => {
    const totals = customerIdToTotals.get(c.id);
    return {
      ...c,
      totalSpent: totals ? totals.totalSpent : 0,
      totalOrders: totals ? totals.totalOrders : 0,
    } as any;
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


  // Stats kaldırıldı (yalın liste görünümü)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold olka-text-dark">Müşteri İşlemleri</h1>
          <p className="text-gray-600 mt-2">
            Müşterileri yönetin, segmentleri takip edin ve alışveriş geçmişlerini inceleyin
          </p>
        </div>
        <div className="flex gap-3">
          {/* Ürün Sorgulama Butonu */}
          <a 
            href="/dashboard/product-search"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Ürün Sorgulama
          </a>
        </div>
      </div>

      {/* Stats Cards kaldırıldı */}

      {/* Customers List Component */}
      <CustomersList 
        initialCustomers={customersWithComputedTotals as any} 
        users={users}
        canAssign={true}
        canEdit={true}
        canDelete={true}
        showAssignment={true}
      />
    </div>
  );
}
