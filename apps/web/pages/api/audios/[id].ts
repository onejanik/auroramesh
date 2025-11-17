import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../lib/auth/requireUser';
import { deleteAudioNote, getAudioNoteById } from '../../../lib/models/audios';
import { isAdminUser } from '../../../lib/auth/isAdmin';
import { getUserById } from '../../../lib/models/users';

export default async function audioHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  
  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    res.status(400).send('Invalid id');
    return;
  }

  if (req.method === 'GET') {
    const note = getAudioNoteById(id, user.id);
    if (!note) {
      res.status(404).end();
      return;
    }
    res.status(200).json(note);
    return;
  }

  if (req.method === 'DELETE') {
    const note = getAudioNoteById(id);
    if (!note) {
      res.status(404).json({ message: 'Audio note not found' });
      return;
    }
    
    const userRecord = getUserById(user.id);
    const isAdmin = userRecord ? isAdminUser(userRecord) : false;
    const isOwner = note.author.id === user.id;
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    
    const result = deleteAudioNote(id, note.author.id);
    if (!result.changes) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).end('Method Not Allowed');
}

