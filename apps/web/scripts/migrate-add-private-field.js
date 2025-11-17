/**
 * Migration Script: Add is_private field to existing users
 * Run with: node scripts/migrate-add-private-field.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../.data/connectsphere.json');

console.log('🔄 Starting migration: Add is_private field to users...');

try {
  // Read database
  const rawData = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(rawData);

  let updatedCount = 0;

  // Add is_private to all users that don't have it
  db.users = db.users.map((user) => {
    if (user.is_private === undefined) {
      updatedCount++;
      return {
        ...user,
        is_private: false // Default to public
      };
    }
    return user;
  });

  // Write back to database
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log(`✅ Migration complete!`);
  console.log(`   Updated ${updatedCount} user(s)`);
  console.log(`   Total users: ${db.users.length}`);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

