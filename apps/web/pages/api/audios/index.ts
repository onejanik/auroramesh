import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireUser } from '../../../lib/auth/requireUser';
import { createAudioNote, listAudioNotes } from '../../../lib/models/audios';

const schema = z.object({
  audioUrl: z.string().min(1),
  caption: z.string().max(1000).optional()
});

export default async function audiosHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const payload = schema.parse(req.body);
      const note = createAudioNote({ 
        userId: user.id, 
        audioUrl: payload.audioUrl,
        caption: payload.caption 
      });
      res.status(201).json(note);
      return;
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Audio konnte nicht gespeichert werden' });
      return;
    }
  }

  if (req.method === 'GET') {
    const excludeUserId = req.query.excludeUserId ? Number(req.query.excludeUserId) : undefined;
    const audios = listAudioNotes(user.id, excludeUserId);
    res.status(200).json({ audios });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}

