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
    <div className="flex flex-col w-64 h-full bg-[#011321] text-white border-r border-[#ffeacd]/10 shadow-lg">
      <div className="p-6 border-b border-[#ffeacd]/10">
        <h2 className="text-2xl font-bold tracking-tight text-[#22bcb4]">
          Puri Yuanna
          <span className="block text-xs font-normal tracking-widest uppercase text-[#ffeacd] mt-0.5">
            Living & Operations
          </span>
        </h2>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start transition-all ${
                    isActive 
                      ? 'bg-[#22bcb4] text-[#011321] font-bold shadow-sm hover:bg-[#22bcb4]/95 hover:text-[#011321]' 
                      : 'text-slate-300 hover:text-white hover:bg-[#052640]'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#011321]' : 'text-[#22bcb4]'}`} />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-[#ffeacd]/10 bg-[#021829]">
        <div className="mb-3 px-2">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded bg-[#ffeacd] text-[#011321]">
            {user?.role}
          </span>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-300 hover:text-red-200 hover:bg-red-950/40 border-red-900/30" 
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          Logout
        </Button>
      </div>
    </div>
  );
}
