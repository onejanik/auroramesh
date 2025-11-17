# 🌐 AuroraMesh - Modern Social Media Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.x-black)

AuroraMesh ist eine moderne, datenschutzfreundliche Social-Media-Plattform mit Fokus auf Multimedia-Sharing, Community-Building und privatsphäreorientierten Features.

## ✨ Features

### 🔐 Privatsphäre & Sicherheit
- **Private Accounts** mit Follow-Request-System
- **Private Posts** für ausgewählte Follower
- **Content Moderation** mit AI-gestütztem Safety-Check
- **Rate Limiting** zum Schutz vor API-Missbrauch
- **Sichere Authentifizierung** mit JWT und Session-Management

### 📱 Content-Typen
- **Posts** - Bilder und Videos mit Tags und Kommentaren
- **Stories** - Temporäre 24h-Inhalte
- **Polls** - Interaktive Umfragen
- **Events** - Veranstaltungsplanung mit RSVP
- **Slideshows** - Multi-Bild-Präsentationen
- **Audio Notes** - Browser-basierte Audioaufnahmen

### 💬 Soziale Features
- **Likes & Saves** - Interaktion mit Inhalten
- **Kommentare** mit Threading und Löschfunktion
- **Follow-System** mit Follower/Following-Listen
- **Activity Feed** - Benachrichtigungen für Likes, Kommentare, Follows
- **Tag-basierte Suche** - Entdecke Inhalte über Hashtags
- **Reporting** - Melde problematische Inhalte

### 🎨 User Experience
- **Dark/Light Mode** - Automatische Themenwechsel
- **Feed-Filter** - Personalisiere, welche Inhalte du siehst
- **Responsive Design** - Funktioniert auf Desktop und Mobile
- **Admin Panel** - Content-Moderation für Administratoren

## 🚀 Quick Start

### Voraussetzungen
- Node.js >= 18.0.0
- npm oder yarn
- PostgreSQL (für Production) oder JSON-Datei (für Development)

### Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/auroramesh.git
cd auroramesh

# Abhängigkeiten installieren
cd apps/web
npm install

# Umgebungsvariablen konfigurieren
cp env.example .env.local
# Bearbeite .env.local und setze:
# - JWT_SECRET
# - WebDAV-Zugangsdaten für Media-Uploads
# - Datenbank-Konfiguration

# Datenbank initialisieren (Development mit JSON)
npm run db:init

# Development-Server starten
npm run dev
```

Öffne [http://localhost:8000](http://localhost:8000) in deinem Browser.

## 📦 Production Deployment

### Mit Docker

```bash
cd apps/web

# Image bauen
docker build -t auroramesh:latest .

# Container starten (mit PostgreSQL)
docker run -d \
  -p 8000:8000 \
  -e JWT_SECRET="your-secret" \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e POSTGRES_HOST="your-host" \
  -e POSTGRES_PORT="5432" \
  -e POSTGRES_DB="auroramesh" \
  -e POSTGRES_USER="your-user" \
  -e POSTGRES_PASSWORD="your-password" \
  --name auroramesh \
  auroramesh:latest
```

### Manuelle Deployment

Siehe [DEPLOYMENT.md](apps/web/DEPLOYMENT.md) für detaillierte Anleitungen mit Nginx, PM2 und PostgreSQL.

## 🗄️ Datenbank-Strategie

**Development:** JSON-basierte Datei (`.data/connectsphere.json`)
**Production:** PostgreSQL mit vollständigem Schema

Migration: Siehe [DATABASE_MIGRATION.md](apps/web/DATABASE_MIGRATION.md)

## 🏗️ Projektstruktur

```
auroramesh/
├── apps/
│   └── web/                    # Next.js Web-Anwendung
│       ├── components/         # React-Komponenten
│       ├── lib/               # Backend-Logik
│       │   ├── auth/          # Authentifizierung
│       │   ├── models/        # Datenmodelle
│       │   └── moderation/    # Content-Safety
│       ├── pages/             # Next.js Pages & API Routes
│       ├── public/            # Statische Assets
│       ├── styles/            # CSS
│       └── types/             # TypeScript-Typen
├── data/
│   └── migrations/postgres/   # PostgreSQL-Schema
├── docs/                      # Dokumentation
│   ├── legal/                 # Datenschutz & AGB
│   ├── moderation/            # Moderationsrichtlinien
│   └── product/               # Produkt-Roadmap
└── README.md
```

## 🛠️ Verfügbare Scripts

```bash
npm run dev          # Development-Server starten
npm run build        # Production-Build erstellen
npm start            # Production-Server starten (Port 8000)
npm run db:init      # JSON-Datenbank initialisieren
npm run lint         # Code-Linting
```

## 🔧 Umgebungsvariablen

Siehe [env.example](apps/web/env.example) für eine vollständige Liste.

**Wichtigste Variablen:**
- `JWT_SECRET` - Secret für JWT-Token
- `DATABASE_MODE` - `json` (Dev) oder `postgres` (Prod)
- `POSTGRES_*` - PostgreSQL-Konfiguration
- `WEBDAV_*` - WebDAV-Storage für Media
- `NEXT_PUBLIC_APP_URL` - App-Domain (z.B. https://auroramesh.de)

## 🤝 Contributing

Beiträge sind willkommen! Bitte lies [CONTRIBUTING.md](CONTRIBUTING.md) für Details zum Prozess.

### Entwickler-Workflow

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'feat: add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🌟 Features im Detail

### Content-Moderation
- AI-gestützte Überprüfung auf unsichere Inhalte
- Admin-Dashboard für gemeldete Inhalte
- Strike-System für Verstöße

### Performance & Security
- Rate Limiting für alle kritischen Endpoints
- Input-Validierung mit Zod
- Security Headers (X-Frame-Options, CSP, etc.)
- Next.js Production-Optimierungen
- Image Optimization & CDN-Ready

### Privacy by Design
- Private Accounts mit Follow-Requests
- Private Posts für Follower
- Granulare Sichtbarkeits-Kontrollen
- DSGVO-konform

## 📞 Support & Kontakt

- **Issues:** [GitHub Issues](https://github.com/yourusername/auroramesh/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/auroramesh/discussions)
- **Website:** [auroramesh.de](https://auroramesh.de)

## 🎯 Roadmap

Siehe [docs/product/roadmap.md](docs/product/roadmap.md) für geplante Features.

**Nächste Schritte:**
- [ ] WebSocket-basierte Echtzeit-Benachrichtigungen
- [ ] Push-Notifications
- [ ] Story Highlights
- [ ] Advanced Analytics für Creator
- [ ] Mobile Apps (iOS/Android)

---

Made with ❤️ by the AuroraMesh Team
