
'use client';

import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Users, 
  ShoppingBag, 
  ClipboardList, 
  Settings,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  Home,
  BarChart3,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardContentProps {
  session: Session;
}

export default function DashboardContent({ session }: DashboardContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const userRoles = session?.user?.roles ?? [];
  const userPermissions = session?.user?.permissions ?? [];
  const primaryRole = userRoles?.[0]?.name ?? 'Kullanıcı';

  useEffect(() => {
    setMounted(true);
    toast.success(`Hoş geldiniz, ${session?.user?.firstName ?? session?.user?.name}!`);
  }, [session]);

  const handleLogout = async () => {
    try {
      toast.loading('Çıkış yapılıyor...');
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const hasPermission = (permissionName: string) => {
    return userPermissions?.some(p => p?.name === permissionName) ?? false;
  };

  const menuItems = [
    {
      name: 'Ana Sayfa',
      icon: Home,
      href: '/dashboard',
      active: pathname === '/dashboard',
      show: true
    },
    {
      name: 'Kullanıcılar',
      icon: Users,
      href: '/dashboard/users',
      active: pathname?.startsWith('/dashboard/users') || false,
      show: hasPermission('Kullanıcı Yönetimi')
    },
    {
      name: 'Müşteriler',
      icon: ShoppingBag,
      href: '/dashboard/customers',
      active: pathname?.startsWith('/dashboard/customers') || false,
      show: hasPermission('Müşteri Görüntüleme')
    },
    {
      name: 'Görevler',
      icon: ClipboardList,
      href: '/dashboard/tasks',
      active: pathname?.startsWith('/dashboard/tasks') || false,
      show: hasPermission('Görev Görüntüleme')
    },
    {
      name: 'Parametreler',
      icon: Settings,
      href: '/dashboard/parameters',
      active: pathname?.startsWith('/dashboard/parameters') || false,
      show: hasPermission('Parametre Düzenleme')
    },
    {
      name: 'Roller & İzinler',
      icon: Shield,
      href: '/dashboard/roles',
      active: pathname?.startsWith('/dashboard/roles') || false,
      show: hasPermission('Rol Yönetimi')
    },
    {
      name: 'Raporlar',
      icon: BarChart3,
      href: '/dashboard/reports',
      active: pathname?.startsWith('/dashboard/reports') || false,
      show: hasPermission('Rapor Görüntüleme')
    }
  ].filter(item => item.show);

  const quickStats = [
    {
      title: 'Toplam Müşteri',
      value: '1,234',
      icon: Users,
      color: 'bg-blue-500',
      show: hasPermission('Müşteri Görüntüleme')
    },
    {
      title: 'Aktif Görevler',
      value: '47',
      icon: ClipboardList,
      color: 'bg-green-500',
      show: hasPermission('Görev Görüntüleme')
    },
    {
      title: 'Bu Ay Satış',
      value: '₺125K',
      icon: ShoppingBag,
      color: 'bg-purple-500',
      show: true
    },
    {
      title: 'Bekleyen İşler',
      value: '23',
      icon: Bell,
      color: 'bg-orange-500',
      show: hasPermission('Görev Görüntüleme')
    }
  ].filter(stat => stat.show);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {isSidebarOpen ? 
                <X className="h-6 w-6 text-gray-700" /> : 
                <Menu className="h-6 w-6 text-gray-700" />
              }
            </button>
            
            <div className="flex items-center space-x-3">
              <img src="/logo/high5.svg" alt="High5" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold olka-text-blue">High5</h1>
                <p className="text-xs text-gray-500 -mt-1">Backoffice</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.firstName} {session?.user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{primaryRole}</p>
            </div>
            
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          transition-transform duration-300 ease-in-out lg:transition-none
        `}>
          <div className="flex flex-col h-full pt-4">
            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-2">
              {menuItems?.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(item.href);
                      setIsSidebarOpen(false); // Close mobile sidebar
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 md:py-2 rounded-lg cursor-pointer transition-all duration-200 text-left
                      ${item.active 
                        ? 'olka-bg-light-blue olka-text-blue font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.firstName} {session?.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {primaryRole}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
          {/* Welcome Section */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Hoş geldiniz, {session?.user?.firstName}!
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              High5 premium mağazacılık yönetim sisteminize hoş geldiniz. 
              <br className="md:hidden" />
              <span className="block md:inline mt-1 md:mt-0">
                Rol: <span className="font-medium olka-text-blue">{primaryRole}</span>
              </span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            {quickStats?.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">{stat.title}</p>
                      <p className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-2 md:p-3 rounded-lg ${stat.color} flex-shrink-0`}>
                      <Icon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role-based Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Recent Activities */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 olka-text-blue" />
                Son Aktiviteler
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yeni müşteri kaydı</p>
                    <p className="text-xs text-gray-500">2 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Görev tamamlandı</p>
                    <p className="text-xs text-gray-500">15 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yeni görev atandı</p>
                    <p className="text-xs text-gray-500">1 saat önce</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 olka-text-blue" />
                Hızlı İşlemler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hasPermission('Müşteri Ekleme') && (
                  <button 
                    onClick={() => router.push('/dashboard/customers')}
                    className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <Users className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Yeni Müşteri</p>
                  </button>
                )}
                
                {hasPermission('Görev Oluşturma') && (
                  <button 
                    onClick={() => router.push('/dashboard/tasks')}
                    className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <ClipboardList className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Görev Oluştur</p>
                  </button>
                )}
                
                {hasPermission('Rapor Görüntüleme') && (
                  <button 
                    onClick={() => router.push('/dashboard/reports')}
                    className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <BarChart3 className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Raporlar</p>
                  </button>
                )}
                
                {hasPermission('Parametre Düzenleme') && (
                  <button 
                    onClick={() => router.push('/dashboard/parameters')}
                    className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                  >
                    <Settings className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Parametreler</p>
                  </button>
                )}
                
                {hasPermission('Rol Yönetimi') && (
                  <button 
                    onClick={() => router.push('/dashboard/roles')}
                    className="p-4 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
                  >
                    <Shield className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Rol Yönetimi</p>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Role-specific information */}
          <div className="mt-8 card olka-bg-light-blue">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 olka-bg-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold olka-text-blue mb-2">
                  {primaryRole} Rolü Bilgilendirme
                </h3>
                <div className="text-sm text-gray-700">
                  {primaryRole === 'Mağaza Müdürü' && (
                    <p>
                      Mağaza müdürü olarak tüm sistem özelliklerine erişiminiz bulunmaktadır. 
                      Kullanıcı yönetimi, rol atamaları, sistem parametreleri ve raporlama 
                      özelliklerini kullanabilirsiniz.
                    </p>
                  )}
                  {primaryRole === 'Satış Danışmanı' && (
                    <p>
                      Satış danışmanı olarak müşteri bilgilerini görüntüleyebilir, 
                      yeni müşteriler ekleyebilir ve size atanan görevleri takip edebilirsiniz.
                    </p>
                  )}
                  {primaryRole === 'Runner' && (
                    <p>
                      Runner olarak size atanan görevleri görüntüleyebilir, 
                      tamamlayabilir ve müşteri bilgilerine erişebilirsiniz.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
