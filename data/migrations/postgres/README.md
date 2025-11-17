# PostgreSQL Migration Guide

This directory contains SQL migration scripts for PostgreSQL.

## Initial Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (with Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Docker:**
```bash
docker run --name auroramesh-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_USER=auroramesh \
  -e POSTGRES_DB=auroramesh \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create user and database
CREATE USER auroramesh WITH PASSWORD 'your_secure_password';
CREATE DATABASE auroramesh OWNER auroramesh;
GRANT ALL PRIVILEGES ON DATABASE auroramesh TO auroramesh;

# Exit
\q
```

### 3. Run Migration

```bash
# From the project root
psql -U auroramesh -d auroramesh -f data/migrations/postgres/001_initial_schema.sql
```

Or using environment variables:
```bash
PGPASSWORD=your_password psql -h localhost -U auroramesh -d auroramesh -f data/migrations/postgres/001_initial_schema.sql
```

### 4. Configure Environment Variables

Create a `.env.local` file in `apps/web/`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=auroramesh
POSTGRES_USER=auroramesh
POSTGRES_PASSWORD=your_secure_password
```

### 5. Migrate Data from JSON (Optional)

If you have existing data in the JSON file (`.data/connectsphere.json`), you can create a migration script:

```bash
cd apps/web
npm run migrate:json-to-postgres
```

## Verify Setup

```bash
# Connect to database
psql -U auroramesh -d auroramesh

# List tables
\dt

# Check a table
SELECT * FROM users;

# Exit
\q
```

## Production Deployment

For production, ensure:
1. Strong password for database user
2. Firewall rules to restrict database access
3. Regular backups configured
4. SSL/TLS connection enabled
5. Connection pooling properly configured

See `apps/web/DEPLOYMENT.md` for detailed production setup instructions.

