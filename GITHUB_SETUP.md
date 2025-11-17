# 🚀 GitHub Setup Anleitung

Diese Anleitung hilft dir, das AuroraMesh-Repository auf GitHub hochzuladen.

## 📋 Voraussetzungen

1. **GitHub-Account** erstellen (falls noch nicht vorhanden): https://github.com/signup
2. **Git** installiert (bereits erledigt ✅)

## 🔑 SSH-Key einrichten (empfohlen)

### Schritt 1: SSH-Key generieren
```bash
ssh-keygen -t ed25519 -C "deine-email@example.com"
# Drücke Enter für Standard-Speicherort
# Optional: Passphrase eingeben für zusätzliche Sicherheit
```

### Schritt 2: SSH-Key zu GitHub hinzufügen
```bash
# Kopiere den öffentlichen Schlüssel
cat ~/.ssh/id_ed25519.pub
```

1. Gehe zu GitHub → Settings → SSH and GPG keys
2. Klicke auf "New SSH key"
3. Füge den kopierten Key ein
4. Speichern

### Schritt 3: Verbindung testen
```bash
ssh -T git@github.com
# Erwartete Ausgabe: "Hi username! You've successfully authenticated..."
```

## 📦 Repository auf GitHub erstellen

### Option 1: Über GitHub Web-Interface

1. Gehe zu https://github.com/new
2. **Repository name:** `auroramesh` (oder dein gewünschter Name)
3. **Description:** "Modern, privacy-focused social media platform"
4. **Visibility:** Public oder Private (deine Wahl)
5. **NICHT** initialisieren mit:
   - ❌ README
   - ❌ .gitignore
   - ❌ Lizenz
   
   (Diese Dateien existieren bereits lokal!)

6. Klicke auf "Create repository"

### Option 2: Über GitHub CLI (falls installiert)

```bash
gh repo create auroramesh --public --source=. --remote=origin
```

## 🔗 Remote-Repository verbinden

### Mit SSH (empfohlen):
```bash
cd "/home/janik/Dokumente/AI makes Social Media"
git remote add origin git@github.com:DEIN-USERNAME/auroramesh.git
```

### Mit HTTPS:
```bash
cd "/home/janik/Dokumente/AI makes Social Media"
git remote add origin https://github.com/DEIN-USERNAME/auroramesh.git
```

**Ersetze `DEIN-USERNAME` mit deinem GitHub-Benutzernamen!**

## ⬆️ Code hochladen

```bash
# Aktuellen Branch auf GitHub pushen
git push -u origin main

# Überprüfe den Status
git status
```

## 🎯 Nach dem Upload

### 1. Repository-Settings konfigurieren

Gehe zu: `https://github.com/DEIN-USERNAME/auroramesh/settings`

**About-Sektion:**
- Beschreibung hinzufügen
- Topics/Tags hinzufügen: `social-media`, `nextjs`, `typescript`, `privacy`
- Website: `https://auroramesh.de`

**Features aktivieren:**
- ✅ Issues
- ✅ Discussions (optional, für Community)
- ✅ Projects (optional, für Roadmap)
- ❌ Wiki (bereits Docs im Repo)

### 2. Branch-Protection einrichten (Optional)

Gehe zu: Settings → Branches → Add rule

Für `main` Branch:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

### 3. Secrets für GitHub Actions

Falls du CI/CD nutzen möchtest:

Settings → Secrets and variables → Actions → New repository secret

Füge hinzu:
- `JWT_SECRET`
- `WEBDAV_*` (falls benötigt)
- Deployment-Secrets

### 4. Repository-Topics hinzufügen

```
social-media, nextjs, typescript, react, privacy-first, 
docker, postgresql, oauth, pwa, social-network
```

## 📝 Repository-URL

Nach dem Upload ist dein Repository erreichbar unter:
```
https://github.com/DEIN-USERNAME/auroramesh
```

## 🔄 Zukünftige Updates

```bash
# Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "feat: beschreibung deiner änderung"

# Auf GitHub pushen
git push origin main
```

## 🌟 README-Banner hinzufügen (Optional)

Du kannst später Banner/Badges zu deinem README hinzufügen:

```markdown
![GitHub stars](https://img.shields.io/github/stars/DEIN-USERNAME/auroramesh?style=social)
![GitHub forks](https://img.shields.io/github/forks/DEIN-USERNAME/auroramesh?style=social)
![GitHub issues](https://img.shields.io/github/issues/DEIN-USERNAME/auroramesh)
```

## 🎉 Fertig!

Dein Repository ist jetzt auf GitHub! 🚀

### Nächste Schritte:
1. ✅ Repository-Beschreibung vervollständigen
2. ✅ Weitere Dokumentation hinzufügen (falls gewünscht)
3. ✅ Contributors einladen
4. ✅ Issues für bekannte Bugs oder Feature-Requests erstellen
5. ✅ GitHub Actions für CI/CD einrichten

## 🆘 Probleme?

### "Permission denied (publickey)"
→ SSH-Key nicht richtig konfiguriert, siehe Schritt 1-3

### "Repository not found"
→ Überprüfe den Repository-Namen und deine Berechtigungen

### "Updates were rejected"
→ Pull zuerst: `git pull origin main --rebase`

### "fatal: remote origin already exists"
→ Entfernen und neu hinzufügen:
```bash
git remote remove origin
git remote add origin git@github.com:DEIN-USERNAME/auroramesh.git
```

## 📚 Weitere Ressourcen

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

