'use client';

import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from './NotificationDropdown';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-900 px-8 flex items-center justify-between shadow-2xs z-10 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Puri Yuanna Living
        </span>
        <span className="text-muted-foreground/40">•</span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Sistem Task & Approval
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationDropdown />

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-800" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
            {user?.name ? user.name.slice(0, 2) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {user?.name}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
