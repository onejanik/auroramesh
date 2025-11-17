# AuroraMesh Production Deployment Guide

## 🚀 Production Checklist

### 1. Database Setup (PostgreSQL - Recommended for Production)

**Install PostgreSQL:**

Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Create Database and User:**
```bash
sudo -u postgres psql

CREATE USER auroramesh WITH PASSWORD 'your_secure_password';
CREATE DATABASE auroramesh OWNER auroramesh;
GRANT ALL PRIVILEGES ON DATABASE auroramesh TO auroramesh;
\q
```

**Run Migration:**
```bash
cd /home/janik/Dokumente/AI\ makes\ Social\ Media/
PGPASSWORD=your_password psql -h localhost -U auroramesh -d auroramesh -f data/migrations/postgres/001_initial_schema.sql
```

See `data/migrations/postgres/README.md` for detailed migration instructions.

### 2. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# PostgreSQL Database (Production)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=auroramesh
POSTGRES_USER=auroramesh
POSTGRES_PASSWORD=your_secure_password_here

# JSON File Fallback (Development only - will be used if PostgreSQL is not available)
DATABASE_PATH=/var/lib/auroramesh/data/connectsphere.json

# Session Secret (CHANGE THIS!)
SESSION_SECRET=your-very-secure-random-secret-key-here-minimum-32-characters

# WebDAV Storage
WEBDAV_URL=https://your-webdav-server.com/remote.php/dav/files/username/
WEBDAV_USERNAME=your-username
WEBDAV_PASSWORD=your-password

# Public Media URL
PUBLIC_MEDIA_BASE_URL=https://auroramesh.de/media

# Admin Emails
NEXT_PUBLIC_ADMIN_EMAILS=admin@auroramesh.de

# Application URL
NEXT_PUBLIC_APP_URL=https://auroramesh.de

# Node Environment
NODE_ENV=production
```

### 3. Security Hardening

✅ **Rate Limiting**: Already implemented
- Login/Register: 5 attempts per 15 minutes
- Uploads: 20 per hour
- Posts: 50 per hour
- Comments: 100 per hour
- General API: 100 per 15 minutes

✅ **Input Validation**: All inputs validated with Zod schemas

✅ **Content Moderation**: NSFW detection enabled

### 4. Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

### 5. Reverse Proxy (Nginx Example)

```nginx
server {
    listen 80;
    server_name auroramesh.de www.auroramesh.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auroramesh.de www.auroramesh.de;

    ssl_certificate /etc/letsencrypt/live/auroramesh.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auroramesh.de/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebDAV media proxy (if using external storage)
    location /media/ {
        proxy_pass https://your-webdav-server.com/;
        proxy_set_header Host your-webdav-server.com;
    }
}
```

### 6. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "auroramesh" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### 7. Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t auroramesh .
docker run -p 3000:3000 -v /data:/var/lib/auroramesh -e DATABASE_PATH=/var/lib/auroramesh/connectsphere.json auroramesh
```

### 8. Monitoring & Logging

- Use PM2 for process monitoring: `pm2 monit`
- Check logs: `pm2 logs auroramesh`
- Consider adding Sentry for error tracking

### 9. Backup Strategy

**PostgreSQL Database Backup:**
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/lib/auroramesh/backups

# Create backup
pg_dump -U auroramesh -d auroramesh -F c -f $BACKUP_DIR/auroramesh_$DATE.dump

# Keep only last 30 days
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# Restore from backup (if needed):
# pg_restore -U auroramesh -d auroramesh -c $BACKUP_DIR/auroramesh_TIMESTAMP.dump
```

Add to crontab for automatic daily backups:
```bash
0 2 * * * /path/to/backup-script.sh
```

**Media Backup:**
Since media is stored on WebDAV, ensure your WebDAV server has proper backups.

### 10. Performance Optimization

- Enable Next.js image optimization
- Use CDN for static assets
- Enable HTTP/2
- Implement proper caching headers
- Consider using Redis for session storage in high-traffic scenarios

### 11. Security Headers

Add these headers in your reverse proxy:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

## 🔐 Post-Deployment Checklist

- [ ] Set up PostgreSQL database and run migrations
- [ ] Configure PostgreSQL backups
- [ ] Change SESSION_SECRET to a secure random value
- [ ] Configure PostgreSQL connection credentials
- [ ] Configure admin emails
- [ ] Set up SSL certificates (Let's Encrypt recommended)
- [ ] Configure DNS for auroramesh.de
- [ ] Configure WebDAV storage
- [ ] Test rate limiting
- [ ] Test file uploads
- [ ] Verify privacy controls work
- [ ] Check all API endpoints are secured
- [ ] Set up monitoring and alerts
- [ ] Configure backup automation
- [ ] Test disaster recovery
- [ ] Review and remove any debug logs
- [ ] Test username uniqueness and suggestions

## 🆘 Troubleshooting

### Database Issues

**PostgreSQL:**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in .env.production
- Test connection: `psql -U auroramesh -d auroramesh -h localhost`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

**JSON File Fallback:**
- Check file permissions on DATABASE_PATH
- Ensure directory exists and is writable
- Application will automatically use JSON if PostgreSQL is unavailable

### Upload Issues
- Verify WebDAV credentials
- Check WebDAV server accessibility
- Ensure sufficient storage space

### Performance Issues
- Monitor with `pm2 monit`
- Check rate limiting isn't too aggressive
- Consider increasing server resources

## 📞 Support

For issues and questions, please check:
- GitHub Issues
- Documentation
- Community Forums

---

**Remember**: Always test thoroughly in a staging environment before deploying to production!

