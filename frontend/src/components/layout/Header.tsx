'use client';

import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
  const user = useAuthStore((state) => state.user);

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

      <div className="flex items-center gap-4">
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
