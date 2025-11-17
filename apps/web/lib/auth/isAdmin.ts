import type { UserRecord } from '../models/users';

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (user: UserRecord | null | undefined) => {
  if (!user) return false;
  const list = getAdminEmails();
  if (list.length) {
    return list.includes(user.email.toLowerCase());
  }
  return user.id === 1;
};

