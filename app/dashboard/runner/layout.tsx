"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu,
  X,
  Home,
  ClipboardList,
  Inbox,
  LogOut,
  User
} from 'lucide-react';

export default function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const primaryRole = session?.user?.roles?.[0]?.name ?? 'Kullanıcı';

  const menuItems = [
    {
      name: 'Ana Sayfa',
      icon: Home,
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      name: 'Görevlerim',
      icon: ClipboardList,
      href: '/dashboard/runner',
      active: pathname === '/dashboard/runner'
    },
    {
      name: 'Görev Havuzu',
      icon: Inbox,
      href: '/dashboard/runner?tab=task-pool',
      active: pathname === '/dashboard/runner' && typeof window !== 'undefined' && window.location.search.includes('tab=task-pool')
    }
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
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
                        ? 'bg-blue-50 text-blue-600 font-medium' 
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
  );
}
