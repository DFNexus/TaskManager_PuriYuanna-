'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ListTodo, 
  Send, 
  X,
  Clock
} from 'lucide-react';

interface NotificationItem {
  id: string;
  data: {
    title: string;
    message: string;
    task_id?: number;
    report_id?: number;
    type?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for background updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error('Error marking notification as read:', e);
      }
    }

    setIsOpen(false);

    // Route based on notification type and user role
    const type = notif.data?.type;
    const taskId = notif.data?.task_id;

    if (type === 'report_submitted') {
      router.push('/dashboard/approvals');
    } else if (taskId && user?.role === 'Staff') {
      router.push(`/dashboard/my-tasks/${taskId}`);
    } else if (type === 'report_approved' || type === 'report_rejected') {
      if (user?.role === 'Staff' && taskId) {
        router.push(`/dashboard/my-tasks/${taskId}`);
      } else {
        router.push('/dashboard/approvals');
      }
    } else if (taskId) {
      router.push('/dashboard/tasks');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all as read:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j yang lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'report_approved':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'report_rejected':
        return <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />;
      case 'report_submitted':
        return <Send className="h-4 w-4 text-[#22bcb4] shrink-0" />;
      case 'task_assigned':
      default:
        return <ListTodo className="h-4 w-4 text-amber-600 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifikasi"
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-3.5 border-b flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-primary hover:text-primary font-medium"
                disabled={loading}
                onClick={handleMarkAllAsRead}
              >
                <Check className="mr-1 h-3 w-3" /> Tandai Semua Dibaca
              </Button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs">Belum ada notifikasi untuk Anda.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read_at;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isUnread
                        ? 'bg-teal-50/30 dark:bg-teal-950/20 hover:bg-teal-50/50 dark:hover:bg-teal-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="mt-0.5">{getNotifIcon(notif.data?.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-bold text-gray-900 dark:text-gray-100'
                              : 'font-medium text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {notif.data?.title || 'Pemberitahuan'}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.data?.message}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
