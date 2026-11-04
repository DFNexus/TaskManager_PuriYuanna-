'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSidebar } from './SidebarContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Home, LogOut, CheckSquare, ListTodo, ClipboardCheck, X } from 'lucide-react';
import api from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'Staff' ? [
      { name: 'Tugas Saya', href: '/dashboard/my-tasks', icon: ListTodo },
    ] : []),
    ...(user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'SPV' ? [
      { name: 'Approval Laporan', href: '/dashboard/approvals', icon: ClipboardCheck },
      { name: 'Manajemen Task', href: '/dashboard/tasks', icon: CheckSquare },
    ] : []),
    ...(user?.role === 'Manager' || user?.role === 'Admin' ? [
      { name: 'Manajemen Unit', href: '/dashboard/units', icon: Home },
    ] : []),
    ...(user?.role === 'Admin' ? [
      { name: 'Manajemen Staff', href: '/dashboard/staff', icon: Users },
    ] : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#011321] text-gray-800 dark:text-white border-r border-gray-200 dark:border-[#ffeacd]/10 shadow-lg transition-colors duration-200">
      <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-[#ffeacd]/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#22bcb4]">
            Puri Yuanna
            <span className="block text-[10px] font-medium tracking-widest uppercase text-gray-500 dark:text-[#ffeacd]/80 mt-0.5">
              Guest House & Kost
            </span>
          </h2>
        </div>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={closeMobileSidebar}
          className="lg:hidden h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Tutup Menu</span>
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block"
                onClick={closeMobileSidebar}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start transition-all ${
                    isActive 
                      ? 'bg-[#22bcb4] text-[#011321] dark:text-[#011321] font-bold shadow-xs hover:bg-[#1fa9a2] dark:hover:bg-[#1fa9a2] hover:text-[#011321] dark:hover:text-[#011321]' 
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#052640]'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#011321] dark:text-[#011321]' : 'text-[#22bcb4]'}`} />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#ffeacd]/10 bg-gray-50 dark:bg-[#021829] transition-colors duration-200">
        <div className="mb-3 px-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name}</p>
          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded bg-[#ffeacd] text-[#011321]">
            {user?.role}
          </span>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 shadow-xs dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40 dark:hover:bg-red-950/50 dark:hover:text-red-200 font-medium" 
          onClick={() => {
            closeMobileSidebar();
            handleLogout();
          }}
        >
          <LogOut className="mr-3 h-5 w-5 text-red-500 dark:text-red-400" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative z-50 flex flex-col w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
