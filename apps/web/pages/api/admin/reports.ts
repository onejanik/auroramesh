import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { isAdminUser } from '../../../lib/auth/isAdmin';
import { listReports, resolveReport } from '../../../lib/models/reports';

export default async function adminReportsHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  if (!isAdminUser(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  if (req.method === 'GET') {
    const { status } = req.query;
    const reports = listReports(typeof status === 'string' && (status === 'open' || status === 'resolved') ? status : undefined);
    res.status(200).json({ reports });
    return;
  }

  if (req.method === 'PATCH') {
    const { id } = req.body as { id?: number };
    if (!id) {
      res.status(400).json({ message: 'Report-ID erforderlich' });
      return;
    }
    try {
      const report = resolveReport(id);
      res.status(200).json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Update fehlgeschlagen' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end('Method Not Allowed');
}

