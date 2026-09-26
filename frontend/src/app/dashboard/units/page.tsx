'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Unit {
  id: number;
  nama: string;
  tipe: 'GH' | 'Kost';
  alamat: string | null;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'GH' | 'Kost'>('GH');
  const [alamat, setAlamat] = useState('');

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/units');
      setUnits(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const resetForm = () => {
    setNama('');
    setTipe('GH');
    setAlamat('');
    setEditingId(null);
  };

  const handleEditClick = (unit: Unit) => {
    setNama(unit.nama);
    setTipe(unit.tipe);
    setAlamat(unit.alamat || '');
    setEditingId(unit.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus unit ini?')) return;
    try {
      await api.delete(`/units/${id}`);
      fetchUnits();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus unit');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/units/${editingId}`, { nama, tipe, alamat });
      } else {
        await api.post('/units', { nama, tipe, alamat });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchUnits();
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Unit</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola daftar Guest House dan Kost di Puri Yuanna.</p>
        </div>
        
        <Button className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold shadow-sm transition-all" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Unit
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nama Unit</Label>
                <Input required value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Puri Yuanna GH 1" />
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={tipe} onValueChange={(val) => val && setTipe(val as 'GH' | 'Kost')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GH">Guest House</SelectItem>
                    <SelectItem value="Kost">Kost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alamat Lengkap</Label>
                <Input value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Opsional" />
              </div>
              <Button type="submit" className="w-full bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold">{editingId ? 'Simpan Perubahan' : 'Simpan Unit'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="w-[50px] font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Nama Unit</TableHead>
              <TableHead className="font-semibold">Tipe</TableHead>
              <TableHead className="font-semibold">Alamat</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">Memuat data...</TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">Belum ada unit yang terdaftar.</TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <TableCell className="font-medium">{unit.id}</TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{unit.nama}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs ${unit.tipe === 'GH' ? 'bg-[#22bcb4] text-[#011321]' : 'bg-[#ffeacd] text-[#011321]'}`}>
                      {unit.tipe === 'GH' ? 'Guest House' : 'Kost'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{unit.alamat || '-'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(unit)} className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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
