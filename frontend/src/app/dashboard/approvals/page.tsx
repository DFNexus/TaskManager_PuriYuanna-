'use client';

import { useEffect, useState, useMemo } from 'react';
import api, { getStorageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ClipboardCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  X,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  User,
  History,
  Building2,
  ExternalLink
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  label: string;
  tipe: 'required' | 'optional';
  is_checked: boolean;
  catatan: string | null;
  foto_url: string | null;
}

interface ApprovalLog {
  id: number;
  action: 'approve' | 'reject';
  catatan: string | null;
  created_at: string;
  user: { id: number; name: string; role: string };
}

interface TaskReport {
  id: number;
  task_id: number;
  status: 'pending' | 'approved' | 'rejected';
  catatan_staff: string | null;
  submitted_at: string;
  submitted_by: { id: number; name: string; role: string };
  task: {
    id: number;
    judul: string;
    deskripsi: string | null;
    kategori: string;
    prioritas: 'low' | 'medium' | 'high';
    deadline: string;
    status: string;
    assigned_to: { id: number; name: string; role: string };
    checklist_items: ChecklistItem[];
    unit?: { id: number; nama: string; tipe?: string } | null;
  };
  approval_logs: ApprovalLog[];
}

export default function ApprovalsPage() {
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Form states for approval/rejection
  const [catatanApprove, setCatatanApprove] = useState('');
  const [catatanReject, setCatatanReject] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Photo zoom preview
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchTab = activeTab === 'all' || report.status === activeTab;
      const matchSearch =
        report.task?.judul?.toLowerCase().includes(search.toLowerCase()) ||
        report.submitted_by?.name?.toLowerCase().includes(search.toLowerCase()) ||
        report.task?.kategori?.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [reports, activeTab, search]);

  const metrics = useMemo(() => {
    const pending = reports.filter((r) => r.status === 'pending').length;
    const approved = reports.filter((r) => r.status === 'approved').length;
    const rejected = reports.filter((r) => r.status === 'rejected').length;
    return { pending, approved, rejected, total: reports.length };
  }, [reports]);

  const handleOpenReview = (report: TaskReport) => {
    setSelectedReport(report);
    setIsReviewOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      await api.post(`/reports/${selectedReport.id}/approve`, {
        catatan: catatanApprove || null,
      });

      setIsApproveOpen(false);
      setIsReviewOpen(false);
      setCatatanApprove('');
      fetchReports();
    } catch (e: any) {
      console.error('Error approving report:', e);
      alert(e.response?.data?.message || 'Gagal menyetujui laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!catatanReject.trim()) {
      alert('Alasan revisi wajib diisi agar staf mengetahui perbaikan yang diperlukan.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/reports/${selectedReport.id}/reject`, {
        catatan: catatanReject.trim(),
      });

      setIsRejectOpen(false);
      setIsReviewOpen(false);
      setCatatanReject('');
      fetchReports();
    } catch (e: any) {
      console.error('Error rejecting report:', e);
      alert(e.response?.data?.message || 'Gagal menolak laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Menunggu Review</Badge>;
      case 'approved':
        return <Badge variant="success">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Perlu Revisi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight">Approval & Review Laporan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Inspeksi hasil pengerjaan staf, periksa foto bukti checklist, dan tentukan persetujuan atau permintaan revisi.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs cursor-pointer hover:border-amber-400 transition-colors" onClick={() => setActiveTab('pending')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Menunggu Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu tindakan verifikasi</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => setActiveTab('approved')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Disetujui</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Laporan disahkan</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs cursor-pointer hover:border-red-400 transition-colors" onClick={() => setActiveTab('rejected')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Perlu Revisi</CardTitle>
            <RotateCcw className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Ditolak dengan catatan</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs cursor-pointer hover:border-gray-400 transition-colors" onClick={() => setActiveTab('all')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Laporan</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua riwayat laporan</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-full md:w-auto overflow-x-auto">
          <Button
            size="sm"
            variant={activeTab === 'pending' ? 'secondary' : 'ghost'}
            className={`text-xs h-8 ${activeTab === 'pending' ? 'bg-[#22bcb4] text-[#011321] shadow-xs font-bold' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Menunggu Review ({metrics.pending})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'approved' ? 'secondary' : 'ghost'}
            className={`text-xs h-8 ${activeTab === 'approved' ? 'bg-[#22bcb4] text-[#011321] shadow-xs font-bold' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Disetujui ({metrics.approved})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'rejected' ? 'secondary' : 'ghost'}
            className={`text-xs h-8 ${activeTab === 'rejected' ? 'bg-[#22bcb4] text-[#011321] shadow-xs font-bold' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Perlu Revisi ({metrics.rejected})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'all' ? 'secondary' : 'ghost'}
            className={`text-xs h-8 ${activeTab === 'all' ? 'bg-[#22bcb4] text-[#011321] shadow-xs font-bold' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Semua
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas atau staf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">Judul Tugas</TableHead>
              <TableHead className="font-semibold">Staf Pengirim</TableHead>
              <TableHead className="font-semibold">Waktu Submit</TableHead>
              <TableHead className="font-semibold">Checklist & Bukti</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Memuat daftar laporan masuk...
                </TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Tidak ada laporan pada kategori ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => {
                const totalChecklist = report.task?.checklist_items?.length || 0;
                const photoCount = report.task?.checklist_items?.filter((i) => i.foto_url).length || 0;

                return (
                  <TableRow key={report.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                    <TableCell className="max-w-[220px]">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {report.task?.judul}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3 w-3 text-[#22bcb4] shrink-0" />
                        <span>{report.task?.unit?.nama || 'Umum'}</span>
                        <span className="opacity-40">·</span>
                        <span>{report.task?.kategori}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {report.submitted_by?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.submitted_by?.role}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {new Date(report.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.submitted_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                          {totalChecklist} Item
                        </span>
                        {photoCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <ImageIcon className="h-3.5 w-3.5" /> {photoCount} Foto
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-[#ffeacd] hover:bg-[#ffe0b8] text-[#011321] font-bold shadow-xs"
                        onClick={() => handleOpenReview(report)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Review & Approval Details */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedReport && getStatusBadge(selectedReport.status)}
              <span className="text-xs text-muted-foreground">
                Kategori: <b>{selectedReport?.task?.kategori}</b>
              </span>
            </div>
            <DialogTitle className="text-xl font-bold">
              {selectedReport?.task?.judul}
            </DialogTitle>
            <DialogDescription>
              Disubmit oleh <b>{selectedReport?.submitted_by?.name}</b> pada{' '}
              {selectedReport &&
                new Date(selectedReport.submitted_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
              {selectedReport &&
                new Date(selectedReport.submitted_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
              WIB
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 pt-2">
              {/* Unit Properti */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#22bcb4]" />
                  <span className="font-semibold">Unit Properti:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedReport.task?.unit?.nama || 'Umum / Seluruh Area'}
                  </span>
                </div>
                {selectedReport.task?.unit?.tipe && (
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 border text-[11px] font-mono">
                    {selectedReport.task.unit.tipe}
                  </span>
                )}
              </div>

              {/* Catatan Staff */}
              {selectedReport.catatan_staff && (
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg text-sm">
                  <div className="font-semibold text-xs text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Catatan dari Staf:
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{selectedReport.catatan_staff}</p>
                </div>
              )}

              {/* Checklist Items & Evidence Gallery */}
              <div>
                <h4 className="text-sm font-bold mb-2">Pemeriksaan Item Checklist & Foto Bukti:</h4>
                <div className="space-y-2.5">
                  {selectedReport.task?.checklist_items?.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 border rounded-lg flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-emerald-500 text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{idx + 1}. {item.label}</span>
                            <Badge variant={item.tipe === 'required' ? 'secondary' : 'outline'} className="text-[10px]">
                              {item.tipe === 'required' ? 'Wajib' : 'Opsional'}
                            </Badge>
                          </div>
                          {item.catatan && (
                            <p className="text-xs text-muted-foreground mt-1 bg-white dark:bg-gray-900 p-1.5 rounded border inline-block">
                              Catatan: {item.catatan}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Photo Thumbnail & Action */}
                      {item.foto_url ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className="cursor-pointer group relative overflow-hidden rounded-md border border-teal-500/30 w-12 h-12 bg-slate-100 dark:bg-slate-800"
                            onClick={() => setPreviewPhoto(item.foto_url)}
                            title="Klik untuk memperbesar"
                          >
                            <img
                              src={getStorageUrl(item.foto_url)}
                              alt={`Bukti ${item.label}`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.3';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewPhoto(item.foto_url)}
                            className="h-7 px-2.5 text-xs gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Lihat Foto
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic shrink-0 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3 opacity-50" />
                          Tanpa foto
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Riwayat Approval Log */}
              {selectedReport.approval_logs && selectedReport.approval_logs.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-muted-foreground" /> Riwayat Peninjauan:
                  </h4>
                  <div className="space-y-2">
                    {selectedReport.approval_logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded-md border text-xs ${log.action === 'approve'
                            ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20'
                            : 'bg-red-50/50 border-red-200 dark:bg-red-950/20'
                          }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className={log.action === 'approve' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                            {log.action === 'approve' ? 'Disetujui' : 'Ditolak / Minta Revisi'} oleh {log.user?.name} ({log.user?.role})
                          </span>
                          <span className="text-muted-foreground font-normal">
                            {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {log.catatan && <p className="text-gray-700 dark:text-gray-300">Catatan: {log.catatan}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Reports */}
              {selectedReport.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950"
                    onClick={() => {
                      setCatatanReject('');
                      setIsRejectOpen(true);
                    }}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Minta Revisi / Tolak
                  </Button>
                  <Button
                    className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold"
                    onClick={() => {
                      setCatatanApprove('');
                      setIsApproveOpen(true);
                    }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Setujui (Approve)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm Approve */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Setujui Laporan Tugas</DialogTitle>
            <DialogDescription>
              Tugas &quot;{selectedReport?.task?.judul}&quot; akan disahkan sebagai <b>Selesai (Done)</b> dan notifikasi akan dikirim ke staf.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApproveSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Persetujuan (Opsional)</label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Contoh: Pekerjaan rapi dan sesuai standar."
                value={catatanApprove}
                onChange={(e) => setCatatanApprove(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)} disabled={actionLoading}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold" disabled={actionLoading}>
                {actionLoading ? 'Memproses...' : 'Ya, Setujui Laporan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm Reject */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Minta Revisi / Tolak Laporan</DialogTitle>
            <DialogDescription>
              Tugas akan dikembalikan ke staf untuk diperbaiki. Jelaskan alasan penolakan secara spesifik.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Revisi / Catatan Penolakan (Wajib)</label>
              <textarea
                rows={3}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Contoh: Lantai kamar mandi masih basah dan sprei belum diganti baru."
                value={catatanReject}
                onChange={(e) => setCatatanReject(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)} disabled={actionLoading}>
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={actionLoading}>
                {actionLoading ? 'Memproses...' : 'Kirim Permintaan Revisi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Zoom Foto Bukti */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="sm:max-w-[650px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Foto Bukti Pengerjaan</span>
              {previewPhoto && (
                <a
                  href={getStorageUrl(previewPhoto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-normal text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Buka Tab Baru
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="flex flex-col items-center justify-center bg-black/5 dark:bg-black/30 rounded-lg p-2 overflow-hidden border">
              <img
                src={getStorageUrl(previewPhoto)}
                alt="Foto Bukti"
                className="w-full max-h-[70vh] object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
