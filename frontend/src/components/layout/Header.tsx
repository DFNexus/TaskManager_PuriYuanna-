'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from './NotificationDropdown';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const user = useAuthStore((state) => state.user);
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
    <header className="h-16 border-b border-[#ffeacd]/30 dark:border-[#ffeacd]/10 bg-white dark:bg-[#011321] px-8 flex items-center justify-between shadow-xs z-10 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#22bcb4]">
          Puri Yuanna Living
        </span>
        <span className="text-[#011321]/30 dark:text-[#ffeacd]/30">•</span>
        <span className="text-xs font-medium text-[#011321]/80 dark:text-[#ffeacd]/90">
          Sistem Task & Approval
        </span>
      </div>

      <div className="flex items-center gap-3">
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

        <div className="h-5 w-px bg-slate-200 dark:bg-[#ffeacd]/10" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22bcb4] text-[#011321] font-bold text-xs uppercase shadow-xs">
            {user?.name ? user.name.slice(0, 2) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
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
