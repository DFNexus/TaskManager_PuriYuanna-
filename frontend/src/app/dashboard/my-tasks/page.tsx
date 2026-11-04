'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ListTodo,
  AlertTriangle,
  Play,
  Building2
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  label: string;
  tipe: 'required' | 'optional';
  is_checked: boolean;
}

interface Unit {
  id: number;
  nama: string;
  tipe?: string;
}

interface Task {
  id: number;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  prioritas: 'low' | 'medium' | 'high';
  deadline: string;
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'done' | 'rejected';
  created_by: { id: number; name: string };
  checklist_items: ChecklistItem[];
  unit?: Unit | null;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioritas, setFilterPrioritas] = useState('all');

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (e) {
      console.error('Error fetching my tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="info">Sedang Dikerjakan</Badge>;
      case 'waiting_approval':
        return <Badge variant="purple">Menunggu Review</Badge>;
      case 'done':
        return <Badge variant="success">Selesai</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak / Revisi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Prioritas Tinggi</Badge>;
      case 'medium':
        return <Badge variant="warning">Prioritas Sedang</Badge>;
      case 'low':
        return <Badge variant="success">Prioritas Rendah</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        task.judul.toLowerCase().includes(search.toLowerCase()) ||
        (task.deskripsi && task.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
        task.kategori.toLowerCase().includes(search.toLowerCase()) ||
        (task.unit?.nama && task.unit.nama.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchPrioritas = filterPrioritas === 'all' || task.prioritas === filterPrioritas;

      return matchSearch && matchStatus && matchPrioritas;
    });
  }, [tasks, search, filterStatus, filterPrioritas]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const waiting = tasks.filter((t) => t.status === 'waiting_approval').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total, pending, inProgress, waiting, done };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tugas Saya</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Daftar seluruh tugas operasional yang ditugaskan kepada Anda. Selesaikan checklist dan laporkan hasil pengerjaan.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Perlu Dikerjakan</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Tugas status pending</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-[#22bcb4]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#006e69] dark:text-[#22bcb4]">Sedang Proses</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#22bcb4]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#006e69] dark:text-[#22bcb4]">{metrics.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Checklist sedang dicentang</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Menunggu Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.waiting}</div>
            <p className="text-xs text-muted-foreground mt-1">Laporan disubmit ke SPV</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.done}</div>
            <p className="text-xs text-muted-foreground mt-1">Telah disetujui</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={(val) => val && setFilterStatus(val)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status Tugas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
              <SelectItem value="waiting_approval">Menunggu Review</SelectItem>
              <SelectItem value="done">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak / Revisi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPrioritas} onValueChange={(val) => val && setFilterPrioritas(val)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="high">Tinggi</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="low">Rendah</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-muted-foreground">
          Memuat daftar tugas...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
          <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold">Tidak ada tugas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Saat ini tidak ada tugas yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTasks.map((task) => {
            const totalItems = task.checklist_items?.length || 0;
            const completedItems = task.checklist_items?.filter((i) => i.is_checked).length || 0;
            const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'done';

            return (
              <Card
                key={task.id}
                className="hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {task.kategori}
                      </span>
                      {getPriorityBadge(task.prioritas)}
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  <CardTitle className="text-lg font-bold mt-2 text-gray-900 dark:text-gray-100">
                    {task.judul}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Building2 className="h-3.5 w-3.5 text-[#22bcb4] shrink-0" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {task.unit?.nama || 'Umum / Seluruh Area'}
                    </span>
                    {task.unit?.tipe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                        {task.unit.tipe}
                      </span>
                    )}
                  </div>
                  {task.deskripsi && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                      {task.deskripsi}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Deadline info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-500' : ''}`} />
                      <span className={isOverdue ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
                        Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {new Date(task.deadline).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </span>
                    </div>
                    <span>Dibuat: {task.created_by?.name}</span>
                  </div>

                  {/* Checklist progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                      <span className="text-muted-foreground">Progress Checklist</span>
                      <span>
                        {completedItems} dari {totalItems} item ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <Link href={`/dashboard/my-tasks/${task.id}`} className="block">
                    <Button className="w-full bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold flex items-center justify-center">
                      <Play className="mr-2 h-4 w-4" /> Kerjakan Tugas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
