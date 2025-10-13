
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu,
  X,
  Home,
  Users,
  ShoppingBag,
  ClipboardList,
  Settings,
  Shield,
  BarChart3,
  LogOut,
  User,
  Bell,
  FileText
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Get user permissions
  const userPermissions: Permission[] = session?.user?.permissions ?? [];
  const primaryRole = session?.user?.roles?.[0]?.name ?? 'Kullanıcı';

  const hasPermission = (permissionName: string) => {
    return userPermissions?.some(p => p?.name === permissionName) ?? false;
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

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
      name: 'Görev Tanımları',
      icon: FileText,
      href: '/dashboard/task-definitions',
      active: pathname?.startsWith('/dashboard/task-definitions') || false,
      show: primaryRole === 'Mağaza Müdürü'
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Runner ve Satış Danışmanı için menübar'ı kaldır
  const isRunner = primaryRole === 'Runner';
  const isSalesConsultant = primaryRole === 'Satış Danışmanı';
  const hideSidebar = isRunner || isSalesConsultant;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            {!hideSidebar && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {isSidebarOpen ? 
                  <X className="h-6 w-6 text-gray-700" /> : 
                  <Menu className="h-6 w-6 text-gray-700" />
                }
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <img src="/logo/high5.svg" alt="High5" className="h-6 w-auto" />
            </div>
          </div>

          <div className="flex items-center space-x-4 relative">
            {/* Notifications button - Runner ve Satış Danışmanı için kaldır */}
            {!hideSidebar && (
              <div className="relative">
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                  title="Bildirimler"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            )}

            {/* User dropdown */}
            <div className="relative user-dropdown">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32">{session?.user?.firstName} {session?.user?.lastName}</p>
                  <p className="text-xs text-gray-600 truncate max-w-32">{primaryRole}</p>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </button>
              {/* Click dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' });
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {hideSidebar ? (
        /* Runner ve Satış Danışmanı için sadece main content */
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      ) : (
        /* Diğer roller için sidebar ile birlikte */
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

              {/* User Section */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.firstName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Çıkış Yap</span>
                </button>
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
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
