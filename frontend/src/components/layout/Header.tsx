'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSidebar } from './SidebarContext';
import NotificationDropdown from './NotificationDropdown';
import { Sun, Moon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const { toggleMobileSidebar } = useSidebar();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 border-b border-[#ffeacd]/30 dark:border-[#ffeacd]/10 bg-white dark:bg-[#011321] px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs z-10 shrink-0 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileSidebar}
          className="lg:hidden h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-[#052640] text-gray-700 dark:text-gray-200"
          title="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5 text-[#22bcb4]" />
          <span className="sr-only">Menu Navigasi</span>
        </Button>

        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#22bcb4] truncate">
          Puri Yuanna Living
        </span>
        <span className="hidden sm:inline text-[#011321]/30 dark:text-[#ffeacd]/30">•</span>
        <span className="hidden sm:inline text-xs font-medium text-[#011321]/80 dark:text-[#ffeacd]/90 truncate">
          Sistem Task & Approval
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Dark / Light Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="relative h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-[#052640] transition-colors"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#ffeacd] hover:text-[#22bcb4] transition-colors" />
          ) : (
            <Moon className="h-4 w-4 text-[#011321] hover:text-[#22bcb4] transition-colors" />
          )}
        </Button>

        {/* Notification Bell */}
        <NotificationDropdown />

        <div className="h-5 w-px bg-slate-200 dark:bg-[#ffeacd]/10 mx-0.5 sm:mx-1" />

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22bcb4] text-[#011321] font-bold text-xs uppercase shadow-xs">
            {user?.name ? user.name.slice(0, 2) : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#011321] dark:text-white leading-tight">
              {user?.name}
            </p>
            <span className="inline-block text-[10px] font-medium text-[#22bcb4] leading-tight">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
