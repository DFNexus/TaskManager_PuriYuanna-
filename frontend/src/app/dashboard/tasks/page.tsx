'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  UserCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ListTodo,
  X
} from 'lucide-react';

interface ChecklistItem {
  id?: number;
  task_id?: number;
  label: string;
  tipe: 'required' | 'optional';
  is_checked?: boolean;
  urutan?: number;
  catatan?: string | null;
  foto_url?: string | null;
}

interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  status?: string;
}

interface Task {
  id: number;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  prioritas: 'low' | 'medium' | 'high';
  deadline: string;
  assigned_to: User;
  created_by: { id: number; name: string };
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'done' | 'rejected';
  is_recurring: boolean;
  checklist_items: ChecklistItem[];
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioritas, setFilterPrioritas] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState('Housekeeping');
  const [prioritas, setPrioritas] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ label: string; tipe: 'required' | 'optional' }[]>([
    { label: '', tipe: 'required' }
  ]);

  // Quick reassign state
  const [newAssignee, setNewAssignee] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users')
      ]);
      setTasks(tasksRes.data);
      // Filter only active staff/users who can be assigned tasks
      setStaffList(usersRes.data.filter((u: User) => u.status === 'active' || !u.status));
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setJudul('');
    setDeskripsi('');
    setKategori('Housekeeping');
    setPrioritas('medium');
    setDeadline('');
    setAssignedTo('');
    setChecklistItems([{ label: '', tipe: 'required' }]);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingId(task.id);
    setJudul(task.judul);
    setDeskripsi(task.deskripsi || '');
    setKategori(task.kategori);
    setPrioritas(task.prioritas);
    // Format deadline for datetime-local input (YYYY-MM-DDTHH:mm)
    const dt = new Date(task.deadline);
    const formattedDeadline = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDeadline(formattedDeadline);
    setAssignedTo(task.assigned_to?.id ? task.assigned_to.id.toString() : '');
    setChecklistItems(
      task.checklist_items && task.checklist_items.length > 0
        ? task.checklist_items.map((i) => ({ label: i.label, tipe: i.tipe }))
        : [{ label: '', tipe: 'required' }]
    );
    setIsCreateOpen(true);
  };

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleOpenAssign = (task: Task) => {
    setSelectedTask(task);
    setNewAssignee(task.assigned_to?.id ? task.assigned_to.id.toString() : '');
    setIsAssignOpen(true);
  };

  // Checklist builder helpers
  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { label: '', tipe: 'required' }]);
  };

  const removeChecklistItem = (index: number) => {
    if (checklistItems.length === 1) return;
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, field: 'label' | 'tipe', value: string) => {
    const updated = [...checklistItems];
    if (field === 'label') {
      updated[index].label = value;
    } else if (field === 'tipe') {
      updated[index].tipe = value as 'required' | 'optional';
    }
    setChecklistItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) {
      alert('Silakan pilih staff yang ditugaskan.');
      return;
    }

    const filteredItems = checklistItems
      .filter((i) => i.label.trim() !== '')
      .map((item, index) => ({
        label: item.label.trim(),
        tipe: item.tipe,
        urutan: index,
      }));

    const payload = {
      judul,
      deskripsi: deskripsi || null,
      kategori,
      prioritas,
      deadline,
      assigned_to: parseInt(assignedTo),
      checklist_items: filteredItems,
    };

    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Gagal menyimpan task.');
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newAssignee) return;

    try {
      await api.patch(`/tasks/${selectedTask.id}/assign`, {
        assigned_to: parseInt(newAssignee),
      });
      setIsAssignOpen(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Gagal menugaskan staff.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus task ini?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus task.');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        task.judul.toLowerCase().includes(search.toLowerCase()) ||
        (task.deskripsi && task.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
        (task.assigned_to?.name && task.assigned_to.name.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchPrioritas = filterPrioritas === 'all' || task.prioritas === filterPrioritas;
      const matchKategori = filterKategori === 'all' || task.kategori === filterKategori;

      return matchSearch && matchStatus && matchPrioritas && matchKategori;
    });
  }, [tasks, search, filterStatus, filterPrioritas, filterKategori]);

  // Metric Stats
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done' || t.status === 'waiting_approval').length;
    return { total, pending, inProgress, done };
  }, [tasks]);

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
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>;
      case 'medium':
        return <Badge variant="warning">Sedang</Badge>;
      case 'low':
        return <Badge variant="secondary">Rendah</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Task</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Buat, atur checklist, dan tugaskan pekerjaan harian kepada staff properti.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Task Baru
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Task</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending}</div>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Sedang Dikerjakan</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Selesai / Review</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul, deskripsi, staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(val) => val && setFilterStatus(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">Dikerjakan</SelectItem>
              <SelectItem value="waiting_approval">Menunggu Review</SelectItem>
              <SelectItem value="done">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={filterPrioritas} onValueChange={(val) => val && setFilterPrioritas(val)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="high">Tinggi</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="low">Rendah</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filterKategori} onValueChange={(val) => val && setFilterKategori(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Housekeeping">Housekeeping</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="F&B">F&B</SelectItem>
              <SelectItem value="Front Desk">Front Desk</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">Judul Task</TableHead>
              <TableHead className="font-semibold">Kategori & Prioritas</TableHead>
              <TableHead className="font-semibold">Ditugaskan Ke</TableHead>
              <TableHead className="font-semibold">Deadline</TableHead>
              <TableHead className="font-semibold">Checklist</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Memuat data task...
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Belum ada task yang sesuai dengan kriteria filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const totalChecklist = task.checklist_items?.length || 0;
                const completedChecklist = task.checklist_items?.filter((i) => i.is_checked).length || 0;

                return (
                  <TableRow key={task.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                    <TableCell className="max-w-[220px]">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {task.judul}
                      </div>
                      {task.deskripsi && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {task.deskripsi}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {task.kategori}
                        </span>
                        {getPriorityBadge(task.prioritas)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {task.assigned_to?.name || 'Belum di-assign'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {task.assigned_to?.role || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {new Date(task.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.deadline).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {completedChecklist}/{totalChecklist} Item
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Detail Task"
                          onClick={() => handleOpenDetail(task)}
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Assign Staf"
                          onClick={() => handleOpenAssign(task)}
                        >
                          <UserCheck className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit Task"
                          onClick={() => handleOpenEdit(task)}
                        >
                          <Pencil className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:text-red-600 text-red-500"
                          title="Hapus Task"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Buat / Edit Task */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Task' : 'Buat Task Baru'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Perbarui rincian tugas dan item checklist pengerjaan.'
                : 'Isi detail tugas dan tentukan item checklist untuk dikerjakan staff.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Judul Task</Label>
              <Input
                required
                placeholder="Contoh: Pembersihan Kamar 201"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={kategori} onValueChange={(val) => val && setKategori(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="F&B">F&B</SelectItem>
                    <SelectItem value="Front Desk">Front Desk</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioritas</Label>
                <Select
                  value={prioritas}
                  onValueChange={(val) => val && setPrioritas(val as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah (Low)</SelectItem>
                    <SelectItem value="medium">Sedang (Medium)</SelectItem>
                    <SelectItem value="high">Tinggi (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  required
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tugaskan Kepada (Staff)</Label>
                <Select value={assignedTo} onValueChange={(val) => val && setAssignedTo(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name} ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi / Catatan Tambahan (Opsional)</Label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Berikan instruksi spesifik untuk staff..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            {/* Dynamic Checklist Builder */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Checklist Pengerjaan</h4>
                  <p className="text-xs text-muted-foreground">
                    Susun item checklist yang harus diselesaikan staff.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChecklistItem}
                  className="text-xs h-8"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {checklistItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-5 text-center">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Instruksi item #${index + 1}`}
                      value={item.label}
                      onChange={(e) => updateChecklistItem(index, 'label', e.target.value)}
                      className="flex-1 text-sm h-9"
                    />
                    <Select
                      value={item.tipe}
                      onValueChange={(val) => val && updateChecklistItem(index, 'tipe', val)}
                    >
                      <SelectTrigger className="w-[105px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Wajib</SelectItem>
                        <SelectItem value="optional">Opsional</SelectItem>
                      </SelectContent>
                    </Select>
                    {checklistItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">
              {editingId ? 'Simpan Perubahan Task' : 'Terbitkan Task'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Detail Task */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedTask && getStatusBadge(selectedTask.status)}
              {selectedTask && getPriorityBadge(selectedTask.prioritas)}
            </div>
            <DialogTitle className="text-xl font-bold">{selectedTask?.judul}</DialogTitle>
            <DialogDescription>
              Kategori: {selectedTask?.kategori} · Dibuat oleh: {selectedTask?.created_by?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Ditugaskan Kepada</span>
                  <span className="font-semibold">{selectedTask.assigned_to?.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    ({selectedTask.assigned_to?.role})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Batas Waktu (Deadline)</span>
                  <span className="font-semibold">
                    {new Date(selectedTask.deadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Pukul{' '}
                    {new Date(selectedTask.deadline).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </span>
                </div>
              </div>

              {selectedTask.deskripsi && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Deskripsi / Instruksi:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border p-3 rounded-md">
                    {selectedTask.deskripsi}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Daftar Checklist ({selectedTask.checklist_items?.length || 0} Item):
                </h4>
                <div className="space-y-2">
                  {selectedTask.checklist_items && selectedTask.checklist_items.length > 0 ? (
                    selectedTask.checklist_items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`flex items-start justify-between p-2.5 rounded-md border text-sm ${
                          item.is_checked
                            ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                              item.is_checked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {item.is_checked && <CheckCircle2 className="h-3 w-3" />}
                          </span>
                          <span
                            className={
                              item.is_checked ? 'line-through text-muted-foreground' : 'font-medium'
                            }
                          >
                            {item.label}
                          </span>
                        </div>
                        <Badge variant={item.tipe === 'required' ? 'secondary' : 'outline'} className="text-[10px]">
                          {item.tipe === 'required' ? 'Wajib' : 'Opsional'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Tidak ada item checklist untuk task ini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Reassign */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Tugaskan Ulang Staff</DialogTitle>
            <DialogDescription>
              Pilih staff baru untuk mengerjakan tugas &quot;{selectedTask?.judul}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReassign} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Pilih Staff Pengganti</Label>
              <Select value={newAssignee} onValueChange={(val) => val && setNewAssignee(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Simpan Penugasan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
