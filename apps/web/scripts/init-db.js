#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '../../..');
const defaultDbPath = path.join(root, '.data', 'connectsphere.json');
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

if (!fs.existsSync(dbPath)) {
  const initial = {
    counters: {
      users: 0,
      posts: 0,
      stories: 0,
      polls: 0,
      events: 0,
      slideshows: 0,
      audios: 0,
      reports: 0,
      comments: 0
    },
    users: [],
    posts: [],
    stories: [],
    polls: [],
    poll_votes: [],
    events: [],
    event_rsvps: [],
    slideshows: [],
    audios: [],
    reports: [],
    comments: [],
    followers: [],
    likes: [],
    bookmarks: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
  console.log(`Database created at ${dbPath}`);
} else {
  console.log(`Database already exists at ${dbPath}`);
}

