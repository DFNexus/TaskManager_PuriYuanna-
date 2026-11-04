'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import api, { getStorageUrl } from '@/lib/api';
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
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  FileText,
  Building2,
  ExternalLink
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

interface Unit {
  id: number;
  nama: string;
  tipe: string;
  alamat?: string | null;
}

interface Task {
  id: number;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  prioritas: 'low' | 'medium' | 'high';
  deadline: string;
  assigned_to: User;
  unit_id?: number | null;
  unit?: Unit | null;
  created_by: { id: number; name: string };
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'done' | 'rejected';
  is_recurring: boolean;
  checklist_items: ChecklistItem[];
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioritas, setFilterPrioritas] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');

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
  const [unitId, setUnitId] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ id?: number; label: string; tipe: 'required' | 'optional'; is_checked?: boolean }[]>([
    { label: '', tipe: 'required' }
  ]);

  // Quick reassign state
  const [newAssignee, setNewAssignee] = useState('');

  // Photo upload & preview states for admin
  const [uploadingChecklistId, setUploadingChecklistId] = useState<number | null>(null);
  const [targetChecklistId, setTargetChecklistId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerAdminUpload = (itemId: number) => {
    setTargetChecklistId(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAdminFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetChecklistId || !selectedTask) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingChecklistId(targetChecklistId);
      const res = await api.post(`/checklist-items/${targetChecklistId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedFotoUrl = res.data.foto_url;

      setSelectedTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          checklist_items: prev.checklist_items.map((i) =>
            i.id === targetChecklistId ? { ...i, foto_url: updatedFotoUrl } : i
          ),
        };
      });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTask.id) return t;
          return {
            ...t,
            checklist_items: t.checklist_items.map((i) =>
              i.id === targetChecklistId ? { ...i, foto_url: updatedFotoUrl } : i
            ),
          };
        })
      );
    } catch (err: any) {
      console.error('Error uploading photo by admin:', err);
      alert(err.response?.data?.message || 'Gagal mengunggah foto bukti.');
    } finally {
      setUploadingChecklistId(null);
      setTargetChecklistId(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes, unitsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users').catch((err) => {
          console.warn('Could not fetch staff list:', err.response?.status || err.message);
          return { data: [] };
        }),
        api.get('/units').catch((err) => {
          console.warn('Could not fetch units list:', err.response?.status || err.message);
          return { data: [] };
        })
      ]);
      setTasks(tasksRes.data);
      // Filter only active staff/users who can be assigned tasks
      if (Array.isArray(usersRes?.data)) {
        setStaffList(usersRes.data.filter((u: User) => u.status === 'active' || !u.status));
      }
      if (Array.isArray(unitsRes?.data)) {
        const seen = new Set<string>();
        const uniqueUnits = unitsRes.data.filter((u: Unit) => {
          const key = `${(u.nama || '').trim().toLowerCase()}-${u.tipe}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setUnitsList(uniqueUnits);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'create' || params.get('create') === 'true') {
        handleOpenCreate();
      }
    }
  }, []);

  const resetForm = () => {
    setJudul('');
    setDeskripsi('');
    setKategori('Housekeeping');
    setPrioritas('medium');
    setDeadline('');
    setAssignedTo('');
    setUnitId('');
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
    setUnitId(task.unit_id ? task.unit_id.toString() : (task.unit?.id ? task.unit.id.toString() : ''));
    setChecklistItems(
      task.checklist_items && task.checklist_items.length > 0
        ? task.checklist_items.map((i) => ({
            id: i.id,
            label: i.label,
            tipe: i.tipe,
            is_checked: i.is_checked,
          }))
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

  // Admin/Manager toggle checklist item in detail modal
  const handleToggleAdminCheck = async (item: ChecklistItem) => {
    if (!selectedTask || !item.id) return;
    const newChecked = !item.is_checked;

    setSelectedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist_items: prev.checklist_items.map((i) =>
          i.id === item.id ? { ...i, is_checked: newChecked } : i
        ),
      };
    });

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTask.id) return t;
        return {
          ...t,
          checklist_items: t.checklist_items.map((i) =>
            i.id === item.id ? { ...i, is_checked: newChecked } : i
          ),
        };
      })
    );

    try {
      await api.patch(`/checklist-items/${item.id}`, {
        is_checked: newChecked,
      });
    } catch (err: any) {
      console.error('Error toggling checklist:', err);
      alert(err.response?.data?.message || 'Gagal mengubah status checklist.');
      fetchData();
    }
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
        ...(item.id ? { id: item.id } : {}),
        label: item.label.trim(),
        tipe: item.tipe,
        urutan: index,
        ...(typeof item.is_checked === 'boolean' ? { is_checked: item.is_checked } : {}),
      }));

    if (filteredItems.length === 0) {
      alert('Silakan isi minimal 1 item checklist untuk dikerjakan.');
      return;
    }

    const payload = {
      judul,
      deskripsi: deskripsi || null,
      kategori,
      prioritas,
      deadline,
      assigned_to: parseInt(assignedTo),
      unit_id: unitId && unitId !== 'none' ? parseInt(unitId) : null,
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
        (task.assigned_to?.name && task.assigned_to.name.toLowerCase().includes(search.toLowerCase())) ||
        (task.unit?.nama && task.unit.nama.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchPrioritas = filterPrioritas === 'all' || task.prioritas === filterPrioritas;
      const matchKategori = filterKategori === 'all' || task.kategori === filterKategori;
      const matchUnit =
        filterUnit === 'all' ||
        (filterUnit === 'none' && !task.unit_id && !task.unit) ||
        (task.unit_id?.toString() === filterUnit) ||
        (task.unit?.id?.toString() === filterUnit);

      return matchSearch && matchStatus && matchPrioritas && matchKategori && matchUnit;
    });
  }, [tasks, search, filterStatus, filterPrioritas, filterKategori, filterUnit]);

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
        return <Badge variant="success">Rendah</Badge>;
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
          className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold shadow-sm transition-all flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Task Baru
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-[#22bcb4]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Task</CardTitle>
            <ListTodo className="h-4 w-4 text-[#22bcb4]" />
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
        <Card className="shadow-xs border-l-4 border-l-[#22bcb4]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#006e69] dark:text-[#22bcb4]">Sedang Dikerjakan</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#22bcb4]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#006e69] dark:text-[#22bcb4]">{metrics.inProgress}</div>
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

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(val) => val && setFilterStatus(val)}>
            <SelectTrigger className="w-full sm:w-[130px]">
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
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="high">Tinggi</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="low">Rendah</SelectItem>
            </SelectContent>
          </Select>

          {/* Unit Filter */}
          <Select value={filterUnit} onValueChange={(val) => val && setFilterUnit(val)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Unit Properti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Unit</SelectItem>
              <SelectItem value="none">Umum (Tanpa Unit)</SelectItem>
              {unitsList.map((unit) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filterKategori} onValueChange={(val) => val && setFilterKategori(val)}>
            <SelectTrigger className="w-full sm:w-[130px]">
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

      {/* Mobile Tasks Card List */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center text-muted-foreground border">
            Memuat data task...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center text-muted-foreground border">
            Belum ada task yang sesuai dengan kriteria filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const totalChecklist = task.checklist_items?.length || 0;
            const completedChecklist = task.checklist_items?.filter((i) => i.is_checked).length || 0;
            const percentage = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
              >
                {/* Header row: Categories, priority & status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {task.kategori}
                    </span>
                    {getPriorityBadge(task.prioritas)}
                  </div>
                  {getStatusBadge(task.status)}
                </div>

                {/* Title & description */}
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug">
                    {task.judul}
                  </h3>
                  {task.deskripsi && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {task.deskripsi}
                    </p>
                  )}
                </div>

                {/* Unit & Assignee info */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Unit Properti</span>
                    <div className="flex items-center gap-1 font-medium mt-0.5 truncate">
                      <Building2 className="h-3.5 w-3.5 text-[#22bcb4] shrink-0" />
                      <span className="truncate">{task.unit?.nama || 'Umum'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Ditugaskan Ke</span>
                    <span className="font-medium mt-0.5 block truncate">
                      {task.assigned_to?.name || 'Belum di-assign'}
                    </span>
                  </div>
                </div>

                {/* Deadline & Checklist Progress */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#22bcb4]" />
                      {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(task.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {completedChecklist}/{totalChecklist} Checklist ({percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Mobile Action Buttons Bar */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                    onClick={() => handleOpenDetail(task)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Detail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    title="Assign Staf"
                    onClick={() => handleOpenAssign(task)}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#22bcb4]" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    title="Edit Task"
                    onClick={() => handleOpenEdit(task)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-amber-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Hapus Task"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Tasks Table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">Judul Task</TableHead>
              <TableHead className="font-semibold">Unit Properti</TableHead>
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
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  Memuat data task...
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  Belum ada task yang sesuai dengan kriteria filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const totalChecklist = task.checklist_items?.length || 0;
                const completedChecklist = task.checklist_items?.filter((i) => i.is_checked).length || 0;

                return (
                  <TableRow key={task.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                    <TableCell className="max-w-[200px]">
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
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="h-3.5 w-3.5 text-[#22bcb4] shrink-0" />
                        <span className={task.unit?.nama ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-muted-foreground italic'}>
                          {task.unit?.nama || 'Umum'}
                        </span>
                      </div>
                      {task.unit?.tipe && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {task.unit.tipe}
                        </span>
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
                          <UserCheck className="h-4 w-4 text-[#22bcb4]" />
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
                <Select
                  items={staffList.map((s) => ({ value: s.id.toString(), label: `${s.name} (${s.role})` }))}
                  value={assignedTo}
                  onValueChange={(val) => val && setAssignedTo(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Staff">
                      {(value: string | null) => {
                        if (!value) return 'Pilih Staff';
                        const staff = staffList.find((s) => s.id.toString() === value);
                        return staff ? `${staff.name} (${staff.role})` : 'Pilih Staff';
                      }}
                    </SelectValue>
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
              <Label>Unit Properti yang Ditugaskan (Opsional)</Label>
              <Select
                value={unitId || 'none'}
                onValueChange={(val) => setUnitId(!val || val === 'none' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Unit Properti (Opsional / Umum)">
                    {(value: string | null) => {
                      if (!value || value === 'none') return '-- Umum / Seluruh Area --';
                      const u = unitsList.find((unit) => unit.id.toString() === value);
                      return u ? `${u.nama} (${u.tipe})` : 'Pilih Unit Properti';
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Umum / Seluruh Area --</SelectItem>
                  {unitsList.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.nama} ({unit.tipe})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button type="submit" className="w-full mt-4 bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold">
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
                  <span className="text-xs text-muted-foreground block">Unit Properti</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-4 w-4 text-[#22bcb4] shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedTask.unit?.nama || 'Umum / Seluruh Area'}
                    </span>
                  </div>
                  {selectedTask.unit?.tipe && (
                    <span className="text-xs text-muted-foreground block">
                      Tipe: {selectedTask.unit.tipe} {selectedTask.unit.alamat ? `· ${selectedTask.unit.alamat}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                <span className="text-xs text-muted-foreground block">Batas Waktu (Deadline)</span>
                <span className="font-semibold">
                  {new Date(selectedTask.deadline).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  · Pukul{' '}
                  {new Date(selectedTask.deadline).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB
                </span>
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
                <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                  <span>Daftar Checklist ({selectedTask.checklist_items?.length || 0} Item):</span>
                  <span className="text-xs text-muted-foreground font-normal">Klik kotak untuk ubah status</span>
                </h4>
                <div className="space-y-2">
                  {selectedTask.checklist_items && selectedTask.checklist_items.length > 0 ? (
                    selectedTask.checklist_items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          item.is_checked
                            ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleAdminCheck(item)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${
                                item.is_checked
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                              }`}
                              title="Klik untuk mengubah status centang"
                            >
                              {item.is_checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                            <div>
                              <span
                                className={
                                  item.is_checked ? 'line-through text-muted-foreground' : 'font-medium'
                                }
                              >
                                {item.label}
                              </span>
                              {item.catatan && (
                                <div className="mt-1.5 p-2 bg-slate-50 dark:bg-gray-800/60 rounded text-xs text-muted-foreground border flex items-start gap-1.5">
                                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                                  <span>{item.catatan}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant={item.tipe === 'required' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                            {item.tipe === 'required' ? 'Wajib' : 'Opsional'}
                          </Badge>
                        </div>

                        {/* Photo Evidence Section for Admin */}
                        <div className="mt-2.5 pt-2.5 border-t border-dashed border-gray-200 dark:border-gray-800">
                          {item.foto_url ? (
                            <div className="flex items-center gap-3 p-2 rounded-md bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20">
                              <div
                                className="relative group shrink-0 cursor-pointer overflow-hidden rounded-md border border-teal-500/30 w-12 h-12 bg-slate-100 dark:bg-slate-800"
                                onClick={() => setPreviewImageUrl(item.foto_url || null)}
                              >
                                <img
                                  src={getStorageUrl(item.foto_url)}
                                  alt={`Bukti ${item.label}`}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="h-3.5 w-3.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  Foto bukti terlampir
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewImageUrl(item.foto_url || null)}
                                    className="h-6 px-2 text-[11px] gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Lihat Foto
                                  </Button>
                                  {item.id && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTriggerAdminUpload(item.id!)}
                                      disabled={uploadingChecklistId === item.id}
                                      className="h-6 px-2 text-[11px] gap-1 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                                    >
                                      <Camera className="h-3 w-3" />
                                      {uploadingChecklistId === item.id ? 'Mengunggah...' : 'Ganti Foto'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                <ImageIcon className="h-3.5 w-3.5 opacity-50" />
                                Belum ada foto bukti
                              </span>
                              {item.id && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTriggerAdminUpload(item.id!)}
                                  disabled={uploadingChecklistId === item.id}
                                  className="h-7 px-2.5 text-xs gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 shadow-xs"
                                >
                                  <Camera className="h-3.5 w-3.5 text-primary" />
                                  {uploadingChecklistId === item.id ? 'Mengunggah...' : 'Upload Foto Bukti'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
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
              <Select
                items={staffList.map((s) => ({ value: s.id.toString(), label: `${s.name} (${s.role})` }))}
                value={newAssignee}
                onValueChange={(val) => val && setNewAssignee(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Staff">
                    {(value: string | null) => {
                      if (!value) return 'Pilih Staff';
                      const staff = staffList.find((s) => s.id.toString() === value);
                      return staff ? `${staff.name} (${staff.role})` : 'Pilih Staff';
                    }}
                  </SelectValue>
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

            <Button type="submit" className="w-full bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold">
              Simpan Penugasan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for admin photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAdminFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Modal: Preview Foto Bukti Admin */}
      <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
        <DialogContent className="sm:max-w-[600px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Foto Bukti Penyelesaian</span>
              {previewImageUrl && (
                <a
                  href={getStorageUrl(previewImageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-normal text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Buka Tab Baru
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <div className="flex flex-col items-center justify-center bg-black/5 dark:bg-black/30 rounded-lg p-2 overflow-hidden border">
              <img
                src={getStorageUrl(previewImageUrl)}
                alt="Bukti Penyelesaian"
                className="w-full max-h-[70vh] object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
