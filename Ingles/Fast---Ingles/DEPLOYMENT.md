# 🚀 Fast-Ingles VPS Deployment Guide

## Prerequisites

- VPS with Docker and Docker Compose installed
- Git installed on VPS
- Access to Supabase project
- Domain name (optional, can use IP)

---

## 📋 Step 1: Clone Repository

```bash
cd /opt
git clone https://github.com/amical-najul/FastIngles.git
cd FastIngles
```

---

## 🔑 Step 2: Configure Environment Variables

### Backend Environment (.env)

Create `backend/.env` with the following:

```env
# Application Settings
APP_NAME=Fast-Ingles API
APP_VERSION=1.0.0
DEBUG=False

# Security
SECRET_KEY=<GENERATE_STRONG_SECRET_KEY>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Origins (update with your domain)
CORS_ORIGINS=["http://localhost:3000","http://your-domain.com","https://your-domain.com"]

# Supabase Configuration
SUPABASE_URL=https://bfwrxznfgvsdcjznulon.supabase.co
SUPABASE_KEY=<YOUR_SERVICE_ROLE_KEY>

# Database (not used with REST API, but kept for compatibility)
DATABASE_URL=postgresql+asyncpg://postgres:password@db.bfwrxznfgvsdcjznulon.supabase.co:5432/postgres

# AI Providers (optional)
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=<YOUR_GEMINI_KEY>
ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_KEY>
OPENAI_API_KEY=<YOUR_OPENAI_KEY>

# MinIO Storage (optional)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fast-ingles
MINIO_SECURE=false
```

### How to Generate SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🐳 Step 3: Build and Start Services

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs backend_api --tail 50
```

---

## ✅ Step 4: Verify Deployment

### Check Backend Health

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

curl http://localhost:8000/
# Expected: {"name":"Fast-Ingles API","version":"1.0.0","status":"running","docs":"/docs"}
```

### Test Authentication

```bash
# Register test user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🌐 Step 5: Configure Nginx (Optional)

If you want to expose the API via domain:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:
```bash
sudo ln -s /etc/nginx/sites-available/fastingles /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 6: SSL Certificate (Optional)

```bash
sudo certbot --nginx -d api.your-domain.com
```

---

## 📊 Step 7: Monitoring

### View Logs

```bash
# Backend logs
docker compose logs -f backend_api

# All services
docker compose logs -f
```

### Resource Usage

```bash
docker stats
```

---

## 🔄 Step 8: Updates and Maintenance

### Update Application

```bash
cd /opt/FastIngles
git pull
docker compose build
docker compose up -d
```

### Backup Database

Supabase handles backups automatically, but you can export data:

```bash
# From Supabase Dashboard
# Settings → Database → Backups
```

### Restart Services

```bash
docker compose restart backend_api
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker compose logs backend_api

# Common issues:
# 1. Invalid SUPABASE_KEY
# 2. Port 8000 already in use
# 3. Missing environment variables
```

### Connection to Supabase Failing

```bash
# Verify SUPABASE_URL and SUPABASE_KEY
# Check firewall rules
# Ensure service_role key is used (not anon key)
```

### Database Schema Issues

If tables are missing:

```bash
# Execute SQL in Supabase Dashboard
# backend/supabase_schema.sql contains full schema
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration |
| `backend/.env` | Environment configuration |
| `backend/supabase_schema.sql` | Database schema |
| `backend/Dockerfile` | Backend image definition |

---

## 🔗 Useful Commands

```bash
# Stop all services
docker compose down

# Remove all containers and volumes
docker compose down -v

# Rebuild without cache
docker compose build --no-cache

# Scale services
docker compose up -d --scale backend_api=3

# View resource usage
docker stats
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend responding at http://VPS_IP:8000
- [ ] Health endpoint returns "healthy"
- [ ] User registration working
- [ ] User login working
- [ ] JWT tokens being generated
- [ ] Data persisting in Supabase
- [ ] Nginx configured (if using domain)
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Firewall rules updated
- [ ] Logs being monitored

---

## 🆘 Support

For issues, check:
- Backend logs: `docker compose logs backend_api`
- Supabase Dashboard: https://supabase.com/dashboard
- API Documentation: http://VPS_IP:8000/docs
