# 🚀 AuroraMesh - Production Build Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create production environment file
cp env.example .env.production.local

# 3. Configure environment variables (see below)
nano .env.production.local

# 4. Build application
npm run build

# 5. Start production server
npm start
```

## Environment Variables

### Required Variables

```bash
# Session Security
SESSION_SECRET=generate-a-secure-random-string-min-32-chars

# WebDAV Storage Configuration
WEBDAV_URL=https://your-nextcloud.com/remote.php/dav/files/username/
WEBDAV_USERNAME=your-username
WEBDAV_PASSWORD=your-secure-password

# Public Media Access URL
PUBLIC_MEDIA_BASE_URL=https://your-domain.com/media

# Database Location
DATABASE_PATH=/path/to/data/connectsphere.json
```

### Optional Variables

```bash
# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin1@domain.com,admin2@domain.com

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Analytics (optional)
# NEXT_PUBLIC_ANALYTICS_ID=UA-XXXXXXXXX-X

# Error Tracking (optional)
# NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Production Optimizations

### ✅ Already Implemented

1. **Security**
   - Rate limiting on all critical endpoints
   - Input validation with Zod schemas
   - CSRF protection via session tokens
   - Content moderation (NSFW detection)
   - Security headers in next.config.js

2. **Performance**
   - SWC minification enabled
   - Image optimization configured
   - Gzip compression enabled
   - React strict mode for better performance
   - Efficient API data fetching with SWR

3. **SEO & Accessibility**
   - Meta tags configured
   - Semantic HTML structure
   - Dark/Light mode support
   - Responsive design

## Deployment Options

### Option 1: Traditional Server

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start npm --name "auroramesh" -- start
pm2 save
pm2 startup
```

### Option 2: Docker

```bash
docker build -t auroramesh:latest .
docker run -d \
  -p 3000:3000 \
  -v /data:/var/lib/auroramesh \
  -e SESSION_SECRET=your-secret \
  -e DATABASE_PATH=/var/lib/auroramesh/connectsphere.json \
  --name auroramesh \
  auroramesh:latest
```

### Option 3: Vercel/Netlify

AuroraMesh uses a JSON file database, which is not compatible with serverless platforms. 
**Recommendation**: Use traditional hosting or Docker deployment.

## Performance Monitoring

### Built-in Monitoring

Check your server metrics:
```bash
# If using PM2
pm2 monit
pm2 logs auroramesh

# Check memory usage
pm2 list
```

### Recommended External Tools

- **Uptime Monitoring**: UptimeRobot, StatusCake
- **Error Tracking**: Sentry
- **Analytics**: Plausible, Matomo (privacy-friendly)
- **Performance**: Lighthouse CI

## Scaling Considerations

### Current Architecture

AuroraMesh uses:
- JSON file database (suitable for small-medium communities)
- WebDAV for media storage
- In-memory rate limiting

### When to Scale

Consider migrating to a proper database when:
- 1000+ active users
- 10000+ posts
- High concurrent traffic (>100 req/s)

### Migration Path

1. **Database**: JSON → PostgreSQL/MySQL
2. **Storage**: WebDAV → S3/CloudFlare R2
3. **Caching**: Add Redis for sessions & rate limiting
4. **CDN**: CloudFlare or similar

## Security Best Practices

### Pre-Deployment Checklist

- [ ] Change default SESSION_SECRET
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up automated backups
- [ ] Configure fail2ban for brute-force protection
- [ ] Review and test all privacy controls
- [ ] Enable security headers (already in next.config.js)
- [ ] Set up monitoring and alerts
- [ ] Test rate limiting
- [ ] Verify NSFW content moderation

### Ongoing Security

```bash
# Regular updates
npm audit
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies monthly
npm update
```

## Backup Strategy

### Database Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-auroramesh.sh

BACKUP_DIR="/var/backups/auroramesh"
DB_PATH="/var/lib/auroramesh/data/connectsphere.json"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/connectsphere_$DATE.json

# Compress
gzip $BACKUP_DIR/connectsphere_$DATE.json

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.json.gz" -mtime +30 -delete

echo "Backup completed: connectsphere_$DATE.json.gz"
```

Add to crontab:
```bash
# Daily backup at 3 AM
0 3 * * * /usr/local/bin/backup-auroramesh.sh
```

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Runtime Errors

```bash
# Check logs
pm2 logs auroramesh --lines 100

# Restart application
pm2 restart auroramesh

# Check system resources
df -h  # Disk space
free -m  # Memory
top  # CPU usage
```

### Database Issues

```bash
# Check file permissions
ls -la /var/lib/auroramesh/data/

# Ensure directory is writable
chmod 755 /var/lib/auroramesh/data/
chmod 644 /var/lib/auroramesh/data/connectsphere.json

# Validate JSON
cat /var/lib/auroramesh/data/connectsphere.json | jq .
```

## Performance Tuning

### Node.js Options

```bash
# Increase memory limit if needed
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### PM2 Cluster Mode

```bash
# Use all CPU cores
pm2 start npm --name "auroramesh" -i max -- start
```

### Nginx Caching

```nginx
# Add to your nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=auroramesh_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache auroramesh_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_bypass $http_upgrade;
    # ... rest of proxy config
}
```

## Cost Estimation

### Minimum Server Requirements

- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB + media storage
- **Bandwidth**: Depends on usage

### Estimated Monthly Costs

- **VPS (DigitalOcean/Hetzner)**: $10-20/month
- **Domain**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Storage (WebDAV/Nextcloud)**: Included or $5-10/month
- **Backups**: $5/month

**Total**: ~$15-30/month for 100-500 users

## Support & Community

- GitHub Issues: Report bugs and request features
- Documentation: Check README.md
- Deployment Guide: DEPLOYMENT.md

---

**Ready to go live?** Follow the checklist and deploy with confidence! 🚀

