import { createClient } from 'webdav';

export const getWebdavClient = () => {
  const url = process.env.WEBDAV_URL;
  const username = process.env.WEBDAV_USERNAME;
  const password = process.env.WEBDAV_PASSWORD;
  if (!url || !username || !password) {
    throw new Error('WebDAV credentials missing');
  }
  return createClient(url, { username, password });
};

