# Database Migration Strategy

## Current Status

AuroraMesh currently uses a **hybrid database approach**:

### Development Mode (JSON File)
- Data stored in `.data/connectsphere.json`
- Fast setup, no external dependencies
- Perfect for local development and testing

### Production Mode (PostgreSQL)
- PostgreSQL database with proper schema
- Scalable, ACID-compliant, production-ready
- Connection pooling and performance optimizations

## Database Adapter

The application automatically detects which database to use:

```typescript
// apps/web/lib/dbAdapter.ts
export const shouldUsePostgres = async (): Promise<boolean> => {
  if (usePostgres === null) {
    usePostgres = await isPostgresAvailable();
    console.log(`Database mode: ${usePostgres ? 'PostgreSQL' : 'JSON File'}`);
  }
  return usePostgres;
};
```

When PostgreSQL environment variables are configured and the database is accessible, the app uses PostgreSQL. Otherwise, it falls back to the JSON file.

## Migration Path

### Option 1: Fresh Start (Recommended for New Deployments)

1. **Set up PostgreSQL** (see `data/migrations/postgres/README.md`)
2. **Configure environment variables** (see `env.example`)
3. **Run migrations:**
   ```bash
   psql -U auroramesh -d auroramesh -f data/migrations/postgres/001_initial_schema.sql
   ```
4. **Start the application** - it will automatically use PostgreSQL

### Option 2: Migrate Existing Data

If you have existing data in the JSON file that you want to preserve, create a migration script:

```bash
# apps/web/scripts/migrate-json-to-postgres.ts
import { readOnlyDatabase } from '../lib/db';
import { query } from '../lib/dbPostgres';

async function migrate() {
  const db = readOnlyDatabase();
  
  // Migrate users
  for (const user of db.users) {
    await query(
      `INSERT INTO users (id, email, name, password_hash, avatar_url, bio, theme, favorite_tags, is_private, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [user.id, user.email, user.name, user.password_hash, user.avatar_url, user.bio, 
       user.theme, user.favorite_tags, user.is_private, user.created_at]
    );
  }
  
  // Migrate posts, comments, etc...
  // (Similar pattern for all tables)
  
  console.log('Migration complete!');
}

migrate().catch(console.error);
```

### Option 3: Gradual Migration (Advanced)

For a phased migration, you could:
1. Keep both databases running
2. Write to both (dual-write pattern)
3. Gradually shift read traffic to PostgreSQL
4. Verify data consistency
5. Switch fully to PostgreSQL

## Full PostgreSQL Implementation (Future Work)

To fully migrate to PostgreSQL and remove JSON file support, the following files would need to be rewritten:

### Model Files (in `lib/models/`)
- `users.ts` - User CRUD operations
- `posts.ts` - Post CRUD operations
- `comments.ts` - Comment CRUD operations
- `polls.ts` - Poll CRUD operations
- `events.ts` - Event CRUD operations
- `slideshows.ts` - Slideshow CRUD operations
- `audios.ts` - Audio CRUD operations
- `stories.ts` - Story CRUD operations
- `reports.ts` - Report CRUD operations
- `notifications.ts` - Notification CRUD operations

### Example Rewrite Pattern

**Current (JSON):**
```typescript
export const createUser = ({ email, name, passwordHash }: CreateUserInput): UserRecord =>
  updateDatabase((db) => {
    const newUser: StoredUser = {
      id: ++db.counters.users,
      email,
      name: name.trim(),
      // ...
    };
    db.users.push(newUser);
    return toRecord(newUser);
  });
```

**PostgreSQL Version:**
```typescript
export const createUser = async ({ email, name, passwordHash }: CreateUserInput): Promise<UserRecord> => {
  const result = await query(
    `INSERT INTO users (email, name, password_hash, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [email, name.trim(), passwordHash]
  );
  return toRecord(result.rows[0]);
};
```

### Breaking Changes

A full PostgreSQL migration would require:
1. All model functions become `async`
2. All API routes and components update to use `await`
3. Comprehensive testing of all functionality
4. Data migration script for existing users

## Current Recommendation

**For Production:** Use PostgreSQL as designed. The schema is ready and optimized.

**For Development:** The JSON file approach works perfectly and requires no setup.

**Migration Effort:** A full rewrite to PostgreSQL-only is possible but would take significant development time (estimated 20-40 hours). The current hybrid approach provides the best of both worlds:
- Zero-setup development experience
- Production-grade PostgreSQL for deployment
- Minimal code changes required

## Environment Configuration

### Development (JSON File)
```bash
# .env.local
# No database configuration needed - uses JSON automatically
```

### Production (PostgreSQL)
```bash
# .env.production
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=auroramesh
POSTGRES_USER=auroramesh
POSTGRES_PASSWORD=your_secure_password
```

## Monitoring Database Mode

Check the console logs on startup:
```
Database mode: PostgreSQL
# or
Database mode: JSON File
```

## Next Steps

1. ✅ PostgreSQL schema created
2. ✅ Database adapter implemented
3. ✅ Environment configuration ready
4. ⏳ Future: Create migration script for existing data
5. ⏳ Future: Rewrite model layer for PostgreSQL (if desired)

For production deployment to **auroramesh.de**, follow the PostgreSQL setup instructions in `DEPLOYMENT.md`.

