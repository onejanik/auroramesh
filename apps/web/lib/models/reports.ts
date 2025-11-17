import { updateDatabase, readOnlyDatabase, type StoredReport } from '../db';
import { getUserById } from './users';
import type { Report } from '../../types/report';

const toReport = (report: StoredReport): Report => {
  const reporter = getUserById(report.reporter_id);
  return {
    id: report.id,
    reporter: {
      id: reporter?.id ?? report.reporter_id,
      name: reporter?.name ?? null,
      email: reporter?.email ?? ''
    },
    targetType: report.target_type,
    targetId: report.target_id,
    reason: report.reason,
    status: report.status,
    createdAt: report.created_at,
    resolvedAt: report.resolved_at
  };
};

export const createReport = ({
  reporterId,
  targetType,
  targetId,
  reason
}: {
  reporterId: number;
  targetType: StoredReport['target_type'];
  targetId: number;
  reason: string;
}) =>
  updateDatabase((db) => {
    const report: StoredReport = {
      id: ++db.counters.reports,
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      status: 'open',
      created_at: new Date().toISOString()
    };
    db.reports.push(report);
    return toReport(report);
  });

export const listReports = (status?: 'open' | 'resolved'): Report[] => {
  const db = readOnlyDatabase();
  return db.reports
    .filter((report) => (status ? report.status === status : true))
    .map((report) => toReport(report));
};

export const resolveReport = (id: number) =>
  updateDatabase((db) => {
    const report = db.reports.find((entry) => entry.id === id);
    if (!report) {
      throw new Error('Report not found');
    }
    report.status = 'resolved';
    report.resolved_at = new Date().toISOString();
    return toReport(report);
  });

