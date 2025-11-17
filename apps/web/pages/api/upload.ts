import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type File as FormidableFile } from 'formidable';
import fs from 'fs';
import { requireUser } from '../../lib/auth/requireUser';
import { getWebdavClient } from '../../lib/webdav';
import { ensureSfwContent } from '../../lib/moderation/safety';
import { checkRateLimit, rateLimitConfigs } from '../../lib/rateLimit';

export const config = {
  api: {
    bodyParser: false
  }
};

const parseForm = (req: NextApiRequest) =>
  new Promise<{ file: FormidableFile }>((resolve, reject) => {
    const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 50 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      const uploaded = files.file;
      const normalized = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!normalized) {
        reject(new Error('No file uploaded'));
        return;
      }
      resolve({ file: normalized });
    });
  });

export default async function uploadHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  // Rate limiting
  if (checkRateLimit(req, res, rateLimitConfigs.upload)) {
    return;
  }

  try {
    const { file } = await parseForm(req);
    const extension = file.originalFilename?.split('.').pop() ?? 'bin';
    const remotePath = `/uploads/${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;

    // Debug WebDAV config (remove in production)
    console.log('WebDAV Config:', {
      url: process.env.WEBDAV_URL,
      username: process.env.WEBDAV_USERNAME,
      hasPassword: !!process.env.WEBDAV_PASSWORD
    });

    const client = getWebdavClient();
    const folderPath = `/uploads/${user.id}`;
    try {
      await client.stat(folderPath);
    } catch (err: any) {
      if (err?.status === 404) {
        await client.createDirectory(folderPath, { recursive: true });
      } else {
        throw err;
      }
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    await ensureSfwContent(fileBuffer, file.mimetype ?? 'application/octet-stream');
    await client.putFileContents(remotePath, fileBuffer, { overwrite: true });
    fs.unlink(file.filepath, () => undefined);

    const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL;
    const normalizedBase = baseUrl ? (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) : null;
    const fileUrl = normalizedBase ? `${normalizedBase}${remotePath}` : null;

    let mediaType: 'image' | 'video' | 'audio' = 'image';
    if (file.mimetype?.startsWith('video')) {
      mediaType = 'video';
    } else if (file.mimetype?.startsWith('audio')) {
      mediaType = 'audio';
    }

    res.status(200).json({
      storagePath: remotePath,
      previewUrl: fileUrl,
      mediaType
    });
  } catch (error) {
    const status = (error as any)?.status;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Upload failed (status ${status ?? 'n/a'}):`, message);
    console.error('Full error:', error);
    res.status(500).json({ 
      message: `Upload failed (status ${status}): ${message}`,
      debug: process.env.NODE_ENV === 'development' ? { 
        status, 
        error: message,
        config: {
          url: process.env.WEBDAV_URL,
          username: process.env.WEBDAV_USERNAME
        }
      } : undefined
    });
  }
}

