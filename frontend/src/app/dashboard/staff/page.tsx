'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Unit {
  id: number;
  nama: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  unit_id: number | null;
  unit?: Unit;
}

export default function StaffPage() {
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
  const [password, setPassword] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, unitsRes] = await Promise.all([
        api.get('/users'),
        api.get('/units')
      ]);
      setUsers(usersRes.data);
      setUnits(unitsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('Staff');
    setStatus('active');
    setUnitId('none');
    setPassword('');
    setEditingId(null);
  };

  const handleEditClick = (user: User) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setUnitId(user.unit_id ? user.unit_id.toString() : 'none');
    setPassword('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name,
        email,
        role,
        status,
        unit_id: unitId === 'none' ? null : parseInt(unitId)
      };

      if (editingId) {
        if (password) payload.password = password;
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
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Staff</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola akun dan hak akses pegawai.</p>
        </div>

        <Button className="bg-[#22bcb4] hover:bg-[#22bcb4]/90 text-[#011321] font-semibold shadow-sm transition-all" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Staff
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Staff' : 'Tambah Staff Baru'}</DialogTitle>
              {!editingId && <DialogDescription>Password default untuk staff baru adalah <b className="text-gray-800 dark:text-gray-200">password123</b>.</DialogDescription>}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Nama Staff" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@puriyuanna.com" />
              </div>
              {editingId && (
                <div className="space-y-2">
                  <Label>Password Baru (Opsional)</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Kosongkan jika tidak ingin mengubah" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Status</Label>
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
                <Select value={unitId} onValueChange={(val) => val && setUnitId(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada (Pusat)</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-2 bg-[#22bcb4] hover:bg-[#22bcb4]/90 text-[#011321] font-semibold">{editingId ? 'Simpan Perubahan' : 'Buat Akun'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">Memuat data...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">Belum ada staff yang terdaftar.</TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{u.name}</TableCell>
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
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)} className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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
