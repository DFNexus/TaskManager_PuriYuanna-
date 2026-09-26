'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Users, 
  Home, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Plus,
  ListTodo
} from 'lucide-react';

interface Task {
  id: number;
  judul: string;
  kategori: string;
  prioritas: 'low' | 'medium' | 'high';
  deadline: string;
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'done' | 'rejected';
  assigned_to: { id: number; name: string };
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await api.get('/tasks');
        setTasks(res.data);
      } catch (e) {
        console.error('Error fetching dashboard tasks:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const doneTasks = tasks.filter((t) => t.status === 'done' || t.status === 'waiting_approval').length;
  const recentTasks = tasks.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="info">Dikerjakan</Badge>;
      case 'waiting_approval':
        return <Badge variant="purple">Menunggu Review</Badge>;
      case 'done':
        return <Badge variant="success">Selesai</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anda login sebagai <span className="font-semibold text-gray-900 dark:text-gray-100">{user?.role}</span> di sistem Guest House Task Manager Puri Yuanna.
          </p>
        </div>
        {(user?.role === 'Manager' || user?.role === 'Admin') && (
          <Link href="/dashboard/tasks">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Buat Task Baru
            </Button>
          </Link>
        )}
        {user?.role === 'Staff' && (
          <Link href="/dashboard/my-tasks">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center">
              <ListTodo className="mr-2 h-4 w-4" /> Buka Tugas Saya
            </Button>
          </Link>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Task</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role === 'Staff' ? 'Tugas ditugaskan kepada Anda' : 'Semua tugas terdaftar'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{loading ? '...' : pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Belum mulai dikerjakan</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Dikerjakan</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loading ? '...' : inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Sedang dalam proses</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Selesai / Review</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{loading ? '...' : doneTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Telah rampung / review</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards for Staff */}
      {user?.role === 'Staff' && (
        <div>
          <Link href="/dashboard/my-tasks" className="block group">
            <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer bg-gradient-to-r from-teal-50/50 to-transparent dark:from-teal-950/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary text-white">
                    <ListTodo className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">Buka Menu Tugas Saya</h3>
                    <p className="text-sm text-muted-foreground">Lihat checklist, tandai penyelesaian, dan kirim laporan harian</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards for Managers */}
      {(user?.role === 'Manager' || user?.role === 'Admin') && (
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/tasks" className="block group">
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Manajemen Task</h3>
                    <p className="text-xs text-muted-foreground">Kelola tugas harian dan checklist</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/units" className="block group">
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Manajemen Unit</h3>
                    <p className="text-xs text-muted-foreground">Kelola properti Guest House & Kost</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/staff" className="block group">
            <Card className="h-full hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Manajemen Staff</h3>
                    <p className="text-xs text-muted-foreground">Kelola akun dan perizinan staf</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Recent Tasks List */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Tugas Terbaru</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Daftar task yang baru dibuat atau diperbarui</p>
          </div>
          <Link href={user?.role === 'Staff' ? '/dashboard/my-tasks' : '/dashboard/tasks'}>
            <Button variant="ghost" size="sm" className="text-xs">
              Lihat Semua <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Memuat daftar tugas...</p>
          ) : recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Belum ada tugas yang ditambahkan.</p>
              {(user?.role === 'Manager' || user?.role === 'Admin') && (
                <Link href="/dashboard/tasks" className="inline-block mt-3">
                  <Button size="sm" variant="outline">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Buat Task Pertama
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={user?.role === 'Staff' ? `/dashboard/my-tasks/${task.id}` : `/dashboard/tasks`}
                  className="block hover:bg-gray-50/50 dark:hover:bg-gray-800/50 -mx-4 px-4 rounded-md transition-colors"
                >
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.judul}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Kategori: {task.kategori} · Ditugaskan: <span className="font-medium text-gray-700 dark:text-gray-300">{task.assigned_to?.name || '-'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
