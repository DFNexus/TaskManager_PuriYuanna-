'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Home, LogOut, CheckSquare, ListTodo, ClipboardCheck } from 'lucide-react';
import api from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

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
      { name: 'Manajemen Staff', href: '/dashboard/staff', icon: Users },
    ] : []),
  ];

  return (
    <div className="flex flex-col w-64 h-full bg-white dark:bg-gray-900 border-r shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-primary">Puri Yuanna</h2>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive ? 'bg-secondary font-semibold' : ''}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleLogout}>
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
