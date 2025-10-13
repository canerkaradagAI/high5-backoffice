
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/db';
import { Users, Search, UserPlus, ClipboardPlus, ListChecks, Inbox, Plus, ClipboardList, Settings, Shield, BarChart3, Package } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const roleName = session?.user?.roles?.[0]?.name ?? 'Kullanıcı';
  const showOverview = roleName !== 'Satış Danışmanı' && roleName !== 'Runner' && roleName !== 'Mağaza Müdürü';

  // Get basic stats only if needed
  const [totalUsers, totalCustomers, totalTasks, totalSpent] = showOverview
    ? await Promise.all([
        prisma.user.count(),
        prisma.customer.count(),
        prisma.task.count(),
        prisma.customer.aggregate({
          _sum: {
            totalSpent: true,
          },
        })
      ])
    : [0, 0, 0, { _sum: { totalSpent: 0 } } as any];

  return (
    <div className="space-y-6">
      {/* Runner: Specialized task management */}
      {roleName === 'Runner' && (
        <div className="space-y-4">
          {/* Görev İşlemleri */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Görev İşlemleri</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/runner/my-tasks" className="block bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <ListChecks className="h-4 w-4 text-purple-600" /> Görevlerim
                </div>
                <div className="text-xs text-gray-600 mt-1">Size atanan görevleri gör</div>
              </a>
              <a href="/dashboard/runner?tab=task-pool" className="block bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Inbox className="h-4 w-4 text-green-600" /> Görev Havuzu
                </div>
                <div className="text-xs text-gray-600 mt-1">Mevcut görevleri görüntüle ve al</div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mağaza Müdürü: Satış Danışmanı ile aynı tasarım */}
      {!showOverview && roleName === 'Mağaza Müdürü' && (
        <div className="space-y-4">
          {/* Müşteri İşlemleri */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Müşteri İşlemleri</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/manager/customers" className="block bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Users className="h-4 w-4 text-blue-600" /> Müşteri Listesi
                </div>
                <div className="text-xs text-gray-600 mt-1">Tüm müşterileri görüntüle ve ara</div>
              </a>
              <a href="/dashboard/customers/search" className="block bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Search className="h-4 w-4 text-indigo-600" /> Müşteri Arama
                </div>
                <div className="text-xs text-gray-600 mt-1">İsim, telefon veya e-posta ile ara</div>
              </a>
              <a href="/dashboard/product-search" className="block bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Package className="h-4 w-4 text-orange-600" /> Ürün Sorgulama
                </div>
                <div className="text-xs text-gray-600 mt-1">Barkod okutarak ürün bilgilerini sorgula</div>
              </a>
            </div>
          </div>

          {/* Görev İşlemleri */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Görev İşlemleri</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/tasks/new" className="block bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Plus className="h-4 w-4 text-green-600" /> Yeni Görev
                </div>
                <div className="text-xs text-gray-600 mt-1">Yeni görev oluştur ve atama yap</div>
              </a>
              <a href="/dashboard/tasks" className="block bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <ClipboardList className="h-4 w-4 text-purple-600" /> Görevler
                </div>
                <div className="text-xs text-gray-600 mt-1">Tüm görevleri görüntüle ve yönet</div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {!showOverview && roleName === 'Admin' && (
        <div className="space-y-4">
          {/* Admin Panel */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Admin Panel</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/parameters" className="block bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Settings className="h-4 w-4 text-gray-600" /> Parametre
                </div>
                <div className="text-xs text-gray-600 mt-1">Sistem parametrelerini yönet</div>
              </a>
              <a href="/dashboard/roles" className="block bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Shield className="h-4 w-4 text-red-600" /> Roller & İzinler
                </div>
                <div className="text-xs text-gray-600 mt-1">Kullanıcı rolleri ve izinleri yönet</div>
              </a>
              <a href="/dashboard/reports" className="block bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <BarChart3 className="h-4 w-4 text-emerald-600" /> Raporlar
                </div>
                <div className="text-xs text-gray-600 mt-1">Sistem raporları ve analizler</div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sales Consultant: Grouped actions (mobile-like) */}
      {!showOverview && roleName === 'Satış Danışmanı' && (
        <div className="space-y-4">
          {/* Müşteri İşlemleri */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Müşteri İşlemleri</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/customers" className="block bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Users className="h-4 w-4 text-blue-600" /> Müşteri Listesi
                </div>
                <div className="text-xs text-gray-600 mt-1">Tüm müşterileri görüntüle ve ara</div>
              </a>
              <a href="/dashboard/customers/search" className="block bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Search className="h-4 w-4 text-indigo-600" /> Müşteri Arama
                </div>
                <div className="text-xs text-gray-600 mt-1">İsim, telefon veya e-posta ile ara</div>
              </a>
              <a href="/dashboard/product-search" className="block bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Package className="h-4 w-4 text-orange-600" /> Ürün Sorgulama
                </div>
                <div className="text-xs text-gray-600 mt-1">Barkod okutarak ürün bilgilerini sorgula</div>
              </a>
            </div>
          </div>

          {/* Görev İşlemleri */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-800">Görev İşlemleri</div>
            <div className="p-5 pt-3 space-y-3">
              <a href="/dashboard/tasks/new" className="block bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <ClipboardPlus className="h-4 w-4 text-green-600" /> Yeni Görev
                </div>
                <div className="text-xs text-gray-600 mt-1">Kendine veya başkasına görev oluştur</div>
              </a>
              <a href="/dashboard/tasks?view=my" className="block bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <ListChecks className="h-4 w-4 text-purple-600" /> Görevlerim
                </div>
                <div className="text-xs text-gray-600 mt-1">Size atanan görevleri gör</div>
              </a>
              <a href="/dashboard/tasks?view=requests" className="block bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Inbox className="h-4 w-4 text-orange-600" /> Taleplerim
                </div>
                <div className="text-xs text-gray-600 mt-1">Oluşturduğun talepleri takip et</div>
              </a>
              <a href="/dashboard/tasks?view=consultant-pool" className="block bg-yellow-50 hover:bg-yellow-100 border border-yellow-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Inbox className="h-4 w-4 text-yellow-600" /> Görev Havuzu
                </div>
                <div className="text-xs text-gray-600 mt-1">Atanmamış danışman görevleri</div>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Welcome Section (hidden for Sales Consultant) */}
      {showOverview && (
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Hoş geldiniz, {session?.user?.firstName}!
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            High5 premium mağazacılık yönetim sisteminize hoş geldiniz. 
            <br className="md:hidden" />
            <span className="block md:inline mt-1 md:mt-0">
              Rol: <span className="font-medium text-blue-600">{roleName}</span>
            </span>
          </p>
        </div>
      )}

      {/* Quick Stats (hidden for Sales Consultant) */}
      {showOverview && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">Toplam Kullanıcı</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-blue-500 flex-shrink-0">
                <svg className="h-4 w-4 md:h-6 md:w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">Toplam Müşteri</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-green-500 flex-shrink-0">
                <svg className="h-4 w-4 md:h-6 md:w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">Toplam Görev</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-purple-500 flex-shrink-0">
                <svg className="h-4 w-4 md:h-6 md:w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">Toplam Harcama</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">₺{(totalSpent._sum.totalSpent || 0).toLocaleString()}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-orange-500 flex-shrink-0">
                <svg className="h-4 w-4 md:h-6 md:w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Actions (only for non Sales Consultant) */}
      {showOverview && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Son Aktiviteler
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Yeni müşteri eklendi</span>
              <span className="text-gray-400 ml-auto">2 saat önce</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Görev tamamlandı</span>
              <span className="text-gray-400 ml-auto">4 saat önce</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Sistem güncellemesi</span>
              <span className="text-gray-400 ml-auto">1 gün önce</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
              <svg className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <p className="text-sm font-medium">Yeni Müşteri</p>
            </button>
            
            <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
              <svg className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">Yeni Görev</p>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
