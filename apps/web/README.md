# AuroraMesh Web App

**Production Domain:** [auroramesh.de](https://auroramesh.de)

Next.js (Pages Router) Social Media Platform mit:
- Lokales Auth-System (E-Mail + Passwort) mit JWT-Cookie (`/api/auth/*`)
  - ✨ Nutzername-Eindeutigkeit mit intelligenten Vorschlägen
- Feed mit Bild-/Video-Uploads, Stories, Umfragen, Events, Slideshows & Audio-Notizen (`/feed`, `/api/*`)
  - ✨ Browser-basierte Audio-Aufnahme
  - ✨ Anpassbare Feed-Filter
- Profilverwaltung samt Followern & Dark-Mode-Preferenzen (`/profile`, `/api/profile`)
  - ✨ Private Accounts mit Follower-Genehmigung
- Hybrid-Datenbank: JSON für Development, PostgreSQL für Production (siehe `DATABASE_MIGRATION.md`)
- Admin-Oberfläche zur Bearbeitung von Meldungen (`/admin`, `ADMIN_EMAILS` für Freischaltung)
  - ✨ Popup-basierte Melde-Oberfläche
- ✨ Aktivitäts-Feed mit Benachrichtigungen (Likes, Kommentare, Follows)
- Inhalte werden über eine extern konfigurierbare Moderation-API (`MODERATION_API_URL` + `MODERATION_API_KEY`) auf SFW-Compliance geprüft.

## Voraussetzungen

### Development (JSON Database)
- Node.js 18+
- Hetzner Storage Box (WebDAV Zugang + öffentlich erreichbarer Link)
- `.env.local` auf Basis von `env.example`

```bash
cd apps/web
cp env.example .env.local
npm install
npm run db:init         # legt .data/connectsphere.json an
npm run dev             # http://localhost:8000
```

### Production (PostgreSQL Database - Empfohlen)
- Node.js 18+
- PostgreSQL 12+
- Hetzner Storage Box (WebDAV)
- `.env.production` mit PostgreSQL-Credentials

```bash
# PostgreSQL Setup
psql -U postgres
CREATE USER auroramesh WITH PASSWORD 'your_password';
CREATE DATABASE auroramesh OWNER auroramesh;
\q

# Migration ausführen
psql -U auroramesh -d auroramesh -f ../../data/migrations/postgres/001_initial_schema.sql

# Environment konfigurieren
cp env.example .env.production
# POSTGRES_* Variablen in .env.production setzen

# Build & Start
npm run build
npm run start
```

Siehe `DATABASE_MIGRATION.md` für Details zur Datenbank-Migration.

## Deploy-Hinweise für auroramesh.de
- Backend basiert auf Next.js API Routes mit PostgreSQL-Datenbank (Production)
- Storage Box braucht öffentliche URL (z.B. `https://user.your-storagebox.de/remote.php/webdav`) + Credentials
- HTTPS erzwingen, damit Cookies (`SameSite=Lax`, `secure` in Production) korrekt gesetzt werden
- Domain-Konfiguration: DNS für auroramesh.de auf Server zeigen lassen
- SSL-Zertifikate: Let's Encrypt empfohlen (siehe DEPLOYMENT.md)

## 🚀 Production Deployment

**Vollständige Guides verfügbar:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Kompletter Deployment-Guide mit Nginx, PM2, Docker für auroramesh.de
- [PRODUCTION.md](./PRODUCTION.md) - Build-Optimierung & Performance-Tuning
- [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) - Datenbank-Migration von JSON zu PostgreSQL
- [data/migrations/postgres/README.md](../../data/migrations/postgres/README.md) - PostgreSQL Setup & Migrations

### Quick Production Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp env.example .env.production.local
# Edit .env.production.local with your production values

# 3. Build & Start
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t auroramesh .
docker run -d \
  -p 8000:8000 \
  -e POSTGRES_HOST=your-postgres-host \
  -e POSTGRES_USER=auroramesh \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=auroramesh \
  -e SESSION_SECRET=your-secret \
  -e WEBDAV_URL=your-webdav-url \
  -e WEBDAV_USERNAME=your-username \
  -e WEBDAV_PASSWORD=your-password \
  -e NEXT_PUBLIC_APP_URL=https://auroramesh.de \
  --name auroramesh \
  auroramesh:latest
```

### Security Features (Production-Ready)

✅ **Rate Limiting**: Implementiert für alle kritischen Endpunkte
- Login/Register: 5 Versuche / 15 Min
- Uploads: 20 / Stunde
- Posts: 50 / Stunde
- Comments: 100 / Stunde

✅ **Input Validation**: Zod Schemas für alle Inputs

✅ **Content Moderation**: NSFW-Erkennung aktiviert

✅ **Security Headers**: Konfiguriert in next.config.js

✅ **Privacy Controls**: Private Posts & Accounts vollständig implementiert

✅ **Username Validation**: Eindeutigkeitsprüfung mit intelligenten Vorschlägen

✅ **Database**: PostgreSQL für Production, JSON-Fallback für Development

