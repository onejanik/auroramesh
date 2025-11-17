# AuroraMesh Datenbank-Migrationsplan

Die aktuelle JSON-Datei (`.data/connectsphere.json`) ist praktisch für Prototypen, aber nicht skalierbar oder sicher. Nachfolgend ein Vorschlag, wie wir kurzfristig auf eine robuste Datenbank (z. B. PostgreSQL) migrieren können.

## Zielarchitektur
- **PostgreSQL** (lokal via Docker oder Managed-Service wie Supabase / Railway).
- **Prisma ORM** zur Typensicherheit, Migrationen und Seed-Skripten.
- **Next.js API Routes** nutzen weiterhin dieselben Modelle, greifen aber auf Prisma statt auf die JSON-Datei zu.

## Tabellenentwurf (Auszug)
| Tabelle        | Zweck                                    |
| -------------- | ---------------------------------------- |
| `users`        | Auth-Daten, Profil, Theme-Einstellung    |
| `posts`        | Bild-/Video-Posts mit Author FK          |
| `stories`      | Ephemere Stories mit `expires_at`        |
| `followers`    | Follower-Beziehungen                     |
| `likes`        | Reaktionen auf Posts                     |
| `bookmarks`    | Gespeicherte Posts                       |

## Schritt-für-Schritt
1. **Postgres bereitstellen**  
   ```bash
   docker run --name auroramesh-postgres -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
   ```
2. **Prisma installieren & konfigurieren**  
   ```bash
   npm install prisma @prisma/client
   npx prisma init --datasource-provider postgresql
   ```
   `DATABASE_URL` in `.env.local` setzen.
3. **Schema definieren**  
   `prisma/schema.prisma` mit oben genannten Tabellen ausstatten (inkl. Constraints, Indexe, Cascades).
4. **Migration & Seed**  
   ```bash
   npx prisma migrate dev --name init
   npx ts-node scripts/seed.ts  # optional
   ```
5. **Model-Layer anpassen**  
   - `lib/models/*` auf Prisma umstellen.
   - JSON-spezifische Helper entfernen.
6. **Daten migrieren**  
   - Einmaliges Skript schreiben (`scripts/migrate-json-to-postgres.ts`), das die bestehende JSON-Datei einliest und via Prisma in Postgres schreibt.
7. **JSON entfernen / optional fallback**  
   - `DATABASE_PATH` nur noch für Tests oder Offline-Demos nutzen.

## Sicherheit & Betrieb
- Aktivierung von SSL (Managed-DB) bzw. Reverse-Tunnel.
- Regelmäßige Backups (z. B. `pg_dump` via Cron).
- Zugriff über Service-Account mit minimalen Rechten.

## Nächste Schritte
1. Architektur-Entscheidung bestätigen (Postgres vs. alternative DB).
2. Prisma-Schema definieren und Migrationen einchecken.
3. Migration-Script für Bestandsdaten erstellen.
4. Infrastruktur (z. B. Supabase) provisionieren und Secrets in `env` aufnehmen.

Sobald diese Schritte umgesetzt sind, entfällt die JSON-Datei vollständig und AuroraMesh erfüllt grundlegende Sicherheitsanforderungen (ACID, Zugriffskontrolle, Backup).***

