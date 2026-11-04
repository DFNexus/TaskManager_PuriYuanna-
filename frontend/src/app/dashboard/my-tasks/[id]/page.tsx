'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { getStorageUrl } from '@/lib/api';
import { summarizeTaskReports } from '@/lib/approvalUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText, 
  Send, 
  Image as ImageIcon, 
  AlertCircle,
  Check,
  RotateCcw,
  Sparkles,
  Camera,
  Eye,
  Building2,
  ExternalLink,
  History
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  task_id: number;
  label: string;
  deskripsi?: string | null;
  tipe: 'required' | 'optional';
  is_checked: boolean;
  urutan: number;
  catatan: string | null;
  foto_url: string | null;
}

interface Unit {
  id: number;
  nama: string;
  tipe?: string;
  alamat?: string | null;
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
  submitted_at: string;
  status: string;
  catatan_staff: string | null;
  approval_logs?: ApprovalLog[];
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
  reports?: TaskReport[];
}

export default function TaskExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Per-item note editing
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Per-item photo upload loading
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadItem, setTargetUploadItem] = useState<number | null>(null);

  // Submit report modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [catatanStaff, setCatatanStaff] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
    } catch (e: any) {
      console.error('Error fetching task details:', e);
      alert(e.response?.data?.message || 'Gagal memuat detail task.');
      router.push('/dashboard/my-tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  // Toggle item completion
  const handleToggleCheck = async (item: ChecklistItem) => {
    if (!task) return;
    const newChecked = !item.is_checked;

    // Optimistic UI update
    setTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: prev.status === 'pending' ? 'in_progress' : prev.status,
        checklist_items: prev.checklist_items.map((i) =>
          i.id === item.id ? { ...i, is_checked: newChecked } : i
        ),
      };
    });

    try {
      await api.patch(`/checklist-items/${item.id}`, {
        is_checked: newChecked,
      });
    } catch (e) {
      console.error('Error toggling checklist:', e);
      // Revert on failure
      fetchTask();
    }
  };

  // Save note per item
  const handleSaveNote = async (itemId: number) => {
    try {
      await api.patch(`/checklist-items/${itemId}`, {
        catatan: tempNote,
      });

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          checklist_items: prev.checklist_items.map((i) =>
            i.id === itemId ? { ...i, catatan: tempNote } : i
          ),
        };
      });

      setEditingNoteId(null);
      setTempNote('');
    } catch (e) {
      console.error('Error saving note:', e);
      alert('Gagal menyimpan catatan item.');
    }
  };

  // Photo upload trigger
  const handleTriggerUpload = (itemId: number) => {
    setTargetUploadItem(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadItem) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingItemId(targetUploadItem);
      const res = await api.post(`/checklist-items/${targetUploadItem}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedFotoUrl = res.data.foto_url;

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: prev.status === 'pending' ? 'in_progress' : prev.status,
          checklist_items: prev.checklist_items.map((i) =>
            i.id === targetUploadItem ? { ...i, foto_url: updatedFotoUrl } : i
          ),
        };
      });
    } catch (e: any) {
      console.error('Error uploading photo:', e);
      alert(e.response?.data?.message || 'Gagal mengunggah foto bukti.');
    } finally {
      setUploadingItemId(null);
      setTargetUploadItem(null);
    }
  };

  // Submit final report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setSubmitting(true);
      await api.post(`/tasks/${task.id}/submit-report`, {
        catatan_staff: catatanStaff || null,
      });

      setIsSubmitModalOpen(false);
      setCatatanStaff('');
      fetchTask();
    } catch (e: any) {
      console.error('Error submitting report:', e);
      alert(e.response?.data?.message || 'Gagal mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalItems = task?.checklist_items?.length || 0;
  const completedItems = task?.checklist_items?.filter((i) => i.is_checked).length || 0;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const requiredItems = useMemo(() => {
    return task?.checklist_items?.filter((i) => i.tipe === 'required') || [];
  }, [task]);

  const uncompletedRequiredCount = useMemo(() => {
    return requiredItems.filter((i) => !i.is_checked).length;
  }, [requiredItems]);

  const approvalSummary = useMemo(() => {
    return summarizeTaskReports(task?.reports, task?.status || '');
  }, [task]);

  const latestRejectLog = approvalSummary.latestRejectLog;

  const canSubmit = uncompletedRequiredCount === 0 && requiredItems.length > 0;

  const getStatusBadge = (status: string) => {
    if (status === 'done' && approvalSummary.isRevisedApproval) {
      return (
        <Badge className="bg-teal-100 text-teal-900 border border-teal-400/60 dark:bg-teal-900/50 dark:text-teal-200 dark:border-teal-700">
          Revisi Disetujui
        </Badge>
      );
    }
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
        return <Badge variant="destructive">Perlu Revisi</Badge>;
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

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Memuat detail pengerjaan task...
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/my-tasks">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Daftar
          </Button>
        </Link>
        <span className="text-xs text-muted-foreground">
          Kategori: <b className="text-foreground">{task.kategori}</b>
        </span>
      </div>

      {/* Task Header Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(task.status)}
              {approvalSummary.revisionCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <RotateCcw className="h-3 w-3" /> {approvalSummary.revisionCount}x Revisi
                </span>
              )}
              {approvalSummary.isDirectApproval && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  Langsung Approve
                </span>
              )}
              {getPriorityBadge(task.prioritas)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Deadline:{' '}
                <b>
                  {new Date(task.deadline).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  {new Date(task.deadline).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  WIB
                </b>
              </span>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {task.judul}
          </CardTitle>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
            <Building2 className="h-4 w-4 text-[#22bcb4] shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              Unit: {task.unit?.nama || 'Umum / Seluruh Area'}
            </span>
            {task.unit?.tipe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
                {task.unit.tipe}
              </span>
            )}
          </div>

          {task.deskripsi && (
            <div className="mt-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border text-sm text-gray-700 dark:text-gray-300">
              <div className="font-semibold text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                Instruksi Kerja:
              </div>
              <p className="whitespace-pre-line">{task.deskripsi}</p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Progress Bar Section */}
          <div className="bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-lg border">
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                <Sparkles className="h-4 w-4 text-primary" /> Progress Penyelesaian
              </span>
              <span>
                {completedItems} / {totalItems} Selesai ({percentage}%)
              </span>
            </div>
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Notice Banners */}
      {task.status === 'waiting_approval' && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200">
              Laporan Sedang Ditinjau
            </h4>
            <p className="text-purple-700 dark:text-purple-300 mt-0.5">
              Laporan pengerjaan telah dikirimkan ke Supervisor/Manager untuk proses approval. Anda tetap dapat melihat checklist dan foto bukti.
            </p>
          </div>
        </div>
      )}

      {task.status === 'done' && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">
              {approvalSummary.isRevisedApproval ? 'Revisi Tugas Selesai & Disetujui!' : 'Tugas Selesai & Disetujui!'}
            </h4>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Kerja bagus! Seluruh pekerjaan pada tugas ini telah disetujui
              {approvalSummary.latestApproveLog?.user?.name
                ? ` oleh ${approvalSummary.latestApproveLog.user.name} (${approvalSummary.latestApproveLog.user.role})`
                : ' oleh Supervisor'}
              {approvalSummary.revisionCount > 0 ? ` setelah ${approvalSummary.revisionCount}x revisi.` : '.'}
            </p>
          </div>
        </div>
      )}

      {task.status === 'rejected' && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <RotateCcw className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <h4 className="font-semibold text-red-900 dark:text-red-200">
              Perlu Revisi Pengerjaan {approvalSummary.revisionCount > 0 ? `(Revisi ke-${approvalSummary.revisionCount})` : ''}
            </h4>
            <p className="text-red-700 dark:text-red-300 mt-0.5">
              Laporan diminta revisi
              {latestRejectLog?.user?.name
                ? ` oleh ${latestRejectLog.user.name} (${latestRejectLog.user.role})`
                : ' oleh Supervisor'}
              . Mohon periksa kembali catatan dan lakukan perbaikan pada checklist sebelum submit ulang.
            </p>
            {latestRejectLog?.catatan && (
              <div className="mt-2.5 p-3 bg-white dark:bg-gray-900 rounded-md border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200 shadow-2xs">
                <span className="font-bold">
                  Catatan Revisi dari {latestRejectLog.user?.name || 'Supervisor'}:{' '}
                </span>
                <span className="italic">&ldquo;{latestRejectLog.catatan}&rdquo;</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Riwayat Review & Approval */}
      {approvalSummary.logs.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <History className="h-4 w-4 text-[#22bcb4]" /> Riwayat Approval & Revisi
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {approvalSummary.revisionCount > 0 ? `${approvalSummary.revisionCount}x Revisi` : 'Langsung Approve'}
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {(() => {
              let rejectIdx = 0;
              return approvalSummary.logs.map((log) => {
                if (log.action === 'reject') rejectIdx += 1;
                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-md border text-xs ${
                      log.action === 'approve'
                        ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20'
                        : 'bg-red-50/50 border-red-200 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 font-semibold">
                      <span className={log.action === 'approve' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                        {log.action === 'approve'
                          ? approvalSummary.revisionCount > 0
                            ? 'Revisi Disetujui'
                            : 'Disetujui'
                          : `Permintaan Revisi #${rejectIdx}`}{' '}
                        oleh {log.user?.name || '-'} ({log.user?.role || '-'})
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {log.catatan && (
                      <p className="mt-1 text-gray-700 dark:text-gray-300">Catatan: {log.catatan}</p>
                    )}
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      )}

      {/* Checklist Items List */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Daftar Item Checklist</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centang setiap item, tambahkan catatan keterangan jika perlu, dan unggah foto bukti.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {requiredItems.length} Item Wajib
            </span>
          </div>
        </CardHeader>

        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800 p-0">
          {task.checklist_items && task.checklist_items.length > 0 ? (
            task.checklist_items.map((item, index) => {
              const isReadOnly = task.status === 'waiting_approval' || task.status === 'done';

              return (
                <div
                  key={item.id}
                  className={`p-4 transition-colors ${
                    item.is_checked
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Item Label with generous touch target */}
                    <div 
                      className={`flex items-start gap-3 flex-1 ${!isReadOnly ? 'cursor-pointer select-none' : ''}`}
                      onClick={(e) => {
                        if (!isReadOnly && !(e.target as HTMLElement).closest('button, input, textarea, a, .group')) {
                          handleToggleCheck(item);
                        }
                      }}
                    >
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCheck(item);
                        }}
                        className={`mt-0.5 h-6 w-6 min-w-[24px] rounded-md border flex items-center justify-center transition-all ${
                          item.is_checked
                            ? 'bg-[#22bcb4] border-[#22bcb4] text-[#011321] shadow-xs'
                            : 'border-gray-300 dark:border-gray-600 hover:border-[#22bcb4]'
                        } ${isReadOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                      >
                        {item.is_checked && <Check className="h-4 w-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              item.is_checked
                                ? 'line-through text-muted-foreground'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {index + 1}. {item.label}
                          </span>
                          <Badge
                            variant={item.tipe === 'required' ? 'secondary' : 'outline'}
                            className="text-[10px]"
                          >
                            {item.tipe === 'required' ? 'Wajib' : 'Opsional'}
                          </Badge>
                        </div>

                        {/* Deskripsi Tugas per Item dari Admin/Manager/SPV */}
                        {item.deskripsi && (
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {item.deskripsi}
                          </p>
                        )}

                        {/* Catatan / Keterangan item dari Staf */}
                        {item.catatan && editingNoteId !== item.id && (
                          <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded border flex items-start gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <span>Catatan Staf: {item.catatan}</span>
                          </div>
                        )}

                        {/* Note editor form */}
                        {editingNoteId === item.id && (
                          <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Input
                              value={tempNote}
                              placeholder="Tulis catatan pengerjaan (contoh: sprei nomor 2 ada noda)"
                              onChange={(e) => setTempNote(e.target.value)}
                              className="h-9 bg-white dark:bg-gray-900"
                            />
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                className="h-9 text-xs"
                                onClick={() => handleSaveNote(item.id)}
                              >
                                Simpan
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 text-xs"
                                onClick={() => setEditingNoteId(null)}
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons and photo section */}
                        {item.foto_url ? (
                          <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20">
                            <div 
                              className="relative group shrink-0 cursor-pointer overflow-hidden rounded-md border border-teal-500/30 w-14 h-14 bg-slate-100 dark:bg-slate-800"
                              onClick={() => setPreviewImageUrl(item.foto_url)}
                            >
                              <img
                                src={getStorageUrl(item.foto_url)}
                                alt={`Bukti ${item.label}`}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                onLoad={(e) => {
                                  (e.target as HTMLElement).style.opacity = '1';
                                }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.opacity = '0.3';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Foto bukti terunggah
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewImageUrl(item.foto_url)}
                                  className="h-7 px-2.5 text-xs gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  Lihat Foto
                                </Button>
                                {!isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTriggerUpload(item.id)}
                                    disabled={uploadingItemId === item.id}
                                    className="h-7 px-2.5 text-xs gap-1 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                                  >
                                    <Camera className="h-3 w-3" />
                                    {uploadingItemId === item.id ? 'Mengunggah...' : 'Ganti Foto'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {!isReadOnly ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTriggerUpload(item.id)}
                                disabled={uploadingItemId === item.id}
                                className="h-8 px-3 text-xs gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 shadow-xs"
                              >
                                <Camera className="h-3.5 w-3.5 text-primary" />
                                {uploadingItemId === item.id ? 'Mengunggah...' : 'Upload Foto Bukti'}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                <ImageIcon className="h-3.5 w-3.5 opacity-50" />
                                Tidak ada foto bukti
                              </span>
                            )}
                          </div>
                        )}

                        {/* Note action button */}
                        {!isReadOnly && editingNoteId !== item.id && (
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setTempNote(item.catatan || '');
                              }}
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="h-3 w-3" />
                              {item.catatan ? 'Edit Catatan' : '+ Tambah Catatan'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-6 text-sm text-muted-foreground text-center italic">
              Tidak ada item checklist yang terdaftar pada task ini.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottom Submit Action Bar */}
      {task.status !== 'waiting_approval' && task.status !== 'done' && (
        <Card className="shadow-xs border-primary/20 bg-gradient-to-r from-teal-50/30 to-transparent dark:from-teal-950/10">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Siap Mengirimkan Laporan?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canSubmit
                  ? 'Seluruh checklist wajib telah selesai. Klik tombol di samping untuk mengirim ke supervisor.'
                  : `Masih ada ${uncompletedRequiredCount} item checklist wajib yang belum dicentang.`}
              </p>
            </div>

            <Button
              size="lg"
              disabled={!canSubmit}
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold shadow-sm flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto h-11"
            >
              <Send className="h-4 w-4" /> Kirim Laporan Tugas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal: Konfirmasi Submit Laporan */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kirim Laporan Penyelesaian</DialogTitle>
            <DialogDescription>
              Tugas &quot;{task.judul}&quot; akan dikirimkan kepada Supervisor untuk proses inspeksi dan persetujuan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReport} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Akhir Staff (Opsional)</label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Misal: Kamar 201 sudah dibersihkan dan siap ditempati tamu jam 2 siang."
                value={catatanStaff}
                onChange={(e) => setCatatanStaff(e.target.value)}
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              Periksa kembali bahwa semua pekerjaan fisik telah dikerjakan sebelum mengonfirmasi pengiriman.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#22bcb4] hover:bg-[#1fa9a2] text-[#011321] font-bold">
                {submitting ? 'Mengirim...' : 'Ya, Kirim Laporan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Preview Foto Bukti */}
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
