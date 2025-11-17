import type { NextApiRequest, NextApiResponse } from 'next';
import { lookup as lookupMime } from 'mime-types';
import type { FileStat } from 'webdav';
import { getWebdavClient } from '../../lib/webdav';

const allowedPrefix = '/uploads/';

export default async function mediaProxyHandler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;

  if (typeof path !== 'string' || !path.startsWith(allowedPrefix)) {
    res.status(400).json({ message: 'Invalid path' });
    return;
  }

  const client = getWebdavClient();

  try {
    const stat = (await client.stat(path)) as FileStat & { mime?: string };
    const mime = stat.mime || lookupMime(path) || 'application/octet-stream';

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=60');

    const stream = await client.createReadStream(path);
    stream.on('error', (err) => {
      console.error('Stream error:', err.message || String(err));
      if (!res.headersSent) {
        res.status(500).end('Failed to stream media');
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (error: any) {
    const status = error?.status;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Media proxy failed (status ${status ?? 'n/a'}): ${message}`);
    if (status === 404) {
      res.status(404).json({ message: 'Not found' });
    } else if (status === 403) {
      res.status(403).json({ message: 'Forbidden' });
    } else {
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  }
}

