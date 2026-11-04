export interface ApprovalLogEntry {
  id: number;
  action: 'approve' | 'reject';
  catatan: string | null;
  created_at: string;
  user?: { id: number; name: string; role: string } | null;
}

export interface ReportWithLogs {
  id: number;
  status: string;
  submitted_at?: string;
  catatan_staff?: string | null;
  approval_logs?: ApprovalLogEntry[];
}

export interface ApprovalSummary {
  logs: ApprovalLogEntry[];
  rejectLogs: ApprovalLogEntry[];
  approveLogs: ApprovalLogEntry[];
  revisionCount: number;
  latestApproveLog: ApprovalLogEntry | null;
  latestRejectLog: ApprovalLogEntry | null;
  isRevisedApproval: boolean;
  isDirectApproval: boolean;
  isPendingAfterRevision: boolean;
  rejecterSummary: string | null;
}

export function summarizeApprovalLogs(
  logsInput: ApprovalLogEntry[] | undefined | null,
  currentStatus: string
): ApprovalSummary {
  const seen = new Set<number>();
  const logs = (logsInput || [])
    .filter((l) => {
      if (!l) return false;
      if (l.id && seen.has(l.id)) return false;
      if (l.id) seen.add(l.id);
      return true;
    })
    .sort((a, b) => {
      const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (a.id || 0) - (b.id || 0);
    });

  const rejectLogs = logs.filter((l) => l.action === 'reject');
  const approveLogs = logs.filter((l) => l.action === 'approve');
  const revisionCount = rejectLogs.length;

  const latestApproveLog = approveLogs.length > 0 ? approveLogs[approveLogs.length - 1] : null;
  const latestRejectLog = rejectLogs.length > 0 ? rejectLogs[rejectLogs.length - 1] : null;

  const isCompleted = currentStatus === 'approved' || currentStatus === 'done';
  const isWaiting = currentStatus === 'pending' || currentStatus === 'waiting_approval';

  const isRevisedApproval = isCompleted && revisionCount > 0;
  const isDirectApproval = isCompleted && revisionCount === 0 && approveLogs.length > 0;
  const isPendingAfterRevision = isWaiting && revisionCount > 0;

  const rejecterNames = Array.from(
    new Set(
      rejectLogs
        .map((l) => (l.user?.name ? `${l.user.name} (${l.user.role})` : null))
        .filter(Boolean) as string[]
    )
  );

  return {
    logs,
    rejectLogs,
    approveLogs,
    revisionCount,
    latestApproveLog,
    latestRejectLog,
    isRevisedApproval,
    isDirectApproval,
    isPendingAfterRevision,
    rejecterSummary: rejecterNames.length > 0 ? rejecterNames.join(', ') : null,
  };
}

export function summarizeTaskReports(
  reports: ReportWithLogs[] | undefined | null,
  taskStatus: string
): ApprovalSummary {
  const allLogs: ApprovalLogEntry[] = [];
  if (reports && Array.isArray(reports)) {
    for (const report of reports) {
      if (report?.approval_logs) {
        allLogs.push(...report.approval_logs);
      }
    }
  }
  return summarizeApprovalLogs(allLogs, taskStatus);
}

