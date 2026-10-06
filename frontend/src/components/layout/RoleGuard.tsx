'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, setUser, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = Cookies.get('token');
    if (!token) return;

    // Synchronize latest user profile & role from backend
    api.get('/auth/me')
      .then((res) => {
        if (res.data) {
          setUser(res.data);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          logout();
          router.push('/login');
        }
      });
  }, [setUser, logout, router]);

  useEffect(() => {
    if (!mounted || !user) return;

    const role = user.role;

    // Route permissions per role
    if (role === 'Staff') {
      const forbiddenForStaff = ['/dashboard/tasks', '/dashboard/approvals', '/dashboard/units', '/dashboard/staff'];
      if (forbiddenForStaff.some((route) => pathname.startsWith(route))) {
        router.replace('/dashboard/my-tasks');
      }
    } else if (role === 'SPV') {
      const forbiddenForSPV = ['/dashboard/units', '/dashboard/staff'];
      if (forbiddenForSPV.some((route) => pathname.startsWith(route))) {
        router.replace('/dashboard');
      }
    } else if (role === 'Manager') {
      const forbiddenForManager = ['/dashboard/staff'];
      if (forbiddenForManager.some((route) => pathname.startsWith(route))) {
        router.replace('/dashboard');
      }
    }
  }, [mounted, user, pathname, router]);

  return <>{children}</>;
}
