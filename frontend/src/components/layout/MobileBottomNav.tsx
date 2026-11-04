'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSidebar } from './SidebarContext';
import { 
  LayoutDashboard, 
  ListTodo, 
  CheckSquare, 
  ClipboardCheck, 
  Home, 
  Menu
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { toggleMobileSidebar } = useSidebar();

  const isStaff = user?.role === 'Staff';
  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'SPV';

  const navItems = [
    {
      name: 'Beranda',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    ...(isStaff
      ? [
          {
            name: 'Tugas Saya',
            href: '/dashboard/my-tasks',
            icon: ListTodo,
            isActive: pathname.startsWith('/dashboard/my-tasks'),
          },
        ]
      : []),
    ...(isManagerOrAdmin
      ? [
          {
            name: 'Task',
            href: '/dashboard/tasks',
            icon: CheckSquare,
            isActive: pathname.startsWith('/dashboard/tasks'),
          },
          {
            name: 'Approval',
            href: '/dashboard/approvals',
            icon: ClipboardCheck,
            isActive: pathname.startsWith('/dashboard/approvals'),
          },
        ]
      : []),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#011321]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#ffeacd]/15 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="flex items-center justify-around h-15 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg transition-colors ${
                item.isActive
                  ? 'text-[#22bcb4] font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${item.isActive ? 'text-[#22bcb4] stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#22bcb4]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Menu button to open sidebar drawer */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Buka Seluruh Menu"
        >
          <Menu className="h-5 w-5 stroke-[1.75]" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
}

