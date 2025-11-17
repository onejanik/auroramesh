# Security Policy

## 🔒 Sicherheitsrichtlinie

Die Sicherheit von AuroraMesh ist uns wichtig. Wir schätzen die Bemühungen von Security-Researchern und der Community, Schwachstellen verantwortungsvoll zu melden.

## 🛡️ Unterstützte Versionen

Wir bieten Sicherheitsupdates für folgende Versionen:

| Version | Unterstützt          |
| ------- | -------------------- |
| 1.x.x   | ✅ Ja               |
| < 1.0   | ❌ Nein             |

## 🚨 Eine Sicherheitslücke melden

**Bitte melde Sicherheitslücken NICHT über öffentliche GitHub Issues.**

Stattdessen sende bitte eine E-Mail an: **security@auroramesh.de**

Bitte gib folgende Informationen an:
- Art der Sicherheitslücke
- Vollständige Pfade der betroffenen Quelldatei(en)
- Ort des betroffenen Quellcodes (Tag/Branch/Commit oder direkte URL)
- Schritt-für-Schritt-Anleitung zur Reproduktion
- Proof-of-Concept oder Exploit-Code (falls möglich)
- Auswirkung der Schwachstelle, einschließlich wie ein Angreifer diese ausnutzen könnte

Diese Informationen helfen uns, das Problem schneller zu verstehen und zu beheben.

## 📋 Was du erwarten kannst

- Bestätigung deiner Meldung innerhalb von 48 Stunden
- Regelmäßige Updates zum Status der Behebung
- Anerkennung in unseren Security Credits (falls gewünscht)

## 🏆 Security Credits

Wir danken folgenden Security-Researchern für verantwortungsvolle Offenlegung:

- (Noch keine Einträge)

## 🔐 Implementierte Sicherheitsmaßnahmen

### Authentifizierung & Autorisierung
- JWT-basierte Session-Management
- Sichere Cookie-Handling
- CSRF-Protection
- Rate Limiting auf Auth-Endpoints

### API-Sicherheit
- Input-Validierung mit Zod
- SQL-Injection-Schutz (Prepared Statements)
- XSS-Prevention
- Rate Limiting
- Content Security Policy

### Daten-Sicherheit
- Passwort-Hashing mit bcrypt
- HTTPS-only in Production
- Sichere Headers (X-Frame-Options, etc.)
- Environment-basierte Secrets

### Content-Moderation
- AI-gestützte Content-Safety-Checks
- User-Reporting-System
- Admin-Moderation-Tools

### Privacy
- DSGVO-konforme Datenverarbeitung
- Granulare Privacy-Controls
- Private Accounts & Posts
- Follow-Request-System

## 📚 Weitere Ressourcen

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/configuring/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🤝 Responsible Disclosure

Wir verpflichten uns zu:
- Schneller Reaktion auf Sicherheitsmeldungen
- Transparenter Kommunikation über den Behebungsprozess
- Anerkennung von Researchern (falls gewünscht)
- Öffentlicher Bekanntgabe behobener Schwachstellen

Wir erwarten von Reportern:
- Verantwortungsvolle Offenlegung
- Keine Ausnutzung der Schwachstelle
- Keine öffentliche Bekanntgabe vor unserer Freigabe
- Gute Zusammenarbeit bei der Behebung

Vielen Dank für die Unterstützung bei der Sicherheit von AuroraMesh!

