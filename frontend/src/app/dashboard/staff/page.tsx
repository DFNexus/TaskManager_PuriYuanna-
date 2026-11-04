'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';

interface Unit {
  id: number;
  nama: string;
  tipe?: 'GH' | 'Kost' | string;
  alamat?: string | null;
}

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  unit_id: number | null;
  unit?: Unit;
  is_registered?: boolean;
}

export default function StaffPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [status, setStatus] = useState('active');
  const [unitId, setUnitId] = useState<string>('none');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, unitsRes] = await Promise.all([
        api.get('/users'),
        api.get('/units')
      ]);
      setUsers(usersRes.data);
      if (Array.isArray(unitsRes?.data)) {
        const seen = new Set<string>();
        const uniqueUnits = unitsRes.data.filter((u: Unit) => {
          const key = `${(u.nama || '').trim().toLowerCase()}-${u.tipe}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setUnits(uniqueUnits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      router.replace('/dashboard');
      return;
    }
    fetchData();
  }, [currentUser, router]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('Staff');
    setStatus('active');
    setUnitId('none');
    setEditingId(null);
  };

  const handleEditClick = (user: User) => {
    setName(user.name || '');
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setUnitId(user.unit_id ? user.unit_id.toString() : 'none');
    setEditingId(user.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan staff ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Gagal menonaktifkan staff');
    }
  };

  const handleResetRegistration = async (user: User) => {
    if (!confirm(`Reset pendaftaran untuk staf "${user.email}"?\n\nPassword akun ini akan dihapus dan status akun kembali menjadi "Belum Aktivasi". Staf dapat melakukan Sign Up mandiri kembali untuk membuat password baru.`)) {
      return;
    }
    try {
      const res = await api.post(`/users/${user.id}/reset-registration`);
      alert(res.data.message || 'Pendaftaran akun berhasil di-reset.');
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Gagal mereset pendaftaran akun.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: name.trim() || undefined,
        email: email.trim().toLowerCase(),
        role,
        status,
        unit_id: unitId === 'none' ? null : parseInt(unitId)
      };

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge variant="dark">{role}</Badge>;
      case 'Manager':
        return <Badge variant="brand">{role}</Badge>;
      case 'SPV':
        return <Badge variant="cream">{role}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Staff & Hak Akses</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Kelola daftar email staf terotorisasi dan unit penempatan.</p>
        </div>

        <Button className="w-full sm:w-auto bg-[#22bcb4] hover:bg-[#22bcb4]/90 text-[#011321] font-semibold shadow-sm transition-all" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Daftarkan Izin Staf
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Data Staf' : 'Daftarkan Staf Baru (Whitelist)'}</DialogTitle>
              {!editingId ? (
                <DialogDescription>
                  Admin hanya mendaftarkan Email, Role, dan Unit penempatan. Staf akan membuat password sendiri melalui halaman Sign Up.
                </DialogDescription>
              ) : (
                <DialogDescription>
                  Perbarui informasi staf. Demi keamanan sistem, Admin tidak dapat melihat atau mengubah password staf secara langsung.
                </DialogDescription>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  required
                  type="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@puriyuanna.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap {editingId ? '' : '(Opsional)'}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={editingId ? 'Nama Lengkap' : 'Nama Lengkap (opsional, dapat diisi staf saat Sign Up)'} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(val) => val && setRole(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="SPV">Supervisor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Akun</Label>
                  <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unit Penempatan</Label>
                <Select
                  items={[
                    { value: 'none', label: 'Tidak Ada (Pusat)' },
                    ...units.map((u) => ({ value: u.id.toString(), label: u.nama }))
                  ]}
                  value={unitId}
                  onValueChange={(val) => val && setUnitId(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Unit">
                      {(value: string | null) => {
                        if (!value || value === 'none') return 'Tidak Ada (Pusat)';
                        const u = units.find((unit) => unit.id.toString() === value);
                        return u ? u.nama : 'Tidak Ada (Pusat)';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada (Pusat)</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-2 bg-[#22bcb4] hover:bg-[#22bcb4]/90 text-[#011321] font-semibold">
                {editingId ? 'Simpan Perubahan' : 'Daftarkan Izin Staf'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Staff Cards List */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center text-muted-foreground border">
            Memuat data staf...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center text-muted-foreground border">
            Belum ada staff yang terdaftar.
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate">
                    {u.name || <span className="text-gray-400 italic text-sm">(Belum diisi)</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                {getRoleBadge(u.role)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Penempatan</span>
                  <span className="font-medium mt-0.5 block truncate">{u.unit?.nama || 'Pusat (Semua)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Status & Registrasi</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-xs">{u.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                    <span className="text-[10px] text-muted-foreground">({u.is_registered ? 'Terdaftar' : 'Belum Aktivasi'})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(u)}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <Pencil className="h-3.5 w-3.5 text-amber-600" /> Edit
                </Button>
                {u.is_registered && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetRegistration(u)}
                    className="h-8 px-2.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(u.id)}
                  className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Staff Table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Pendaftaran</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">Memuat data...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">Belum ada staff yang terdaftar.</TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    {u.name || <span className="text-gray-400 italic text-xs">(Belum diisi)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(u.role)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.unit?.nama || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.is_registered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        Terdaftar
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                        Belum Aktivasi
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit Data Staf"
                      onClick={() => handleEditClick(u)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {u.is_registered && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset Pendaftaran / Password"
                        onClick={() => handleResetRegistration(u)}
                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Nonaktifkan Staf"
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
