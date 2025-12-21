# Environment Variables - Fast-Ingles Backend

## Required Variables

### Application
```env
APP_NAME=Fast-Ingles API
APP_VERSION=1.0.0
DEBUG=False  # Set to True only for development
```

### Security
```env
SECRET_KEY=<GENERATE_WITH: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### CORS
```env
CORS_ORIGINS=["http://localhost:3000","http://your-domain.com","https://your-domain.com"]
```

### Supabase (REQUIRED)
```env
SUPABASE_URL=https://bfwrxznfgvsdcjznulon.supabase.co
SUPABASE_KEY=<YOUR_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD>
```

## Optional Variables

### Database (Legacy - not used with REST API)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@db.bfwrxznfgvsdcjznulon.supabase.co:5432/postgres
```

### AI Providers
```env
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=<YOUR_KEY>
ANTHROPIC_API_KEY=<YOUR_KEY>
OPENAI_API_KEY=<YOUR_KEY>
```

### MinIO Storage
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fast-ingles
MINIO_SECURE=false
```

## Security Notes

⚠️ **NEVER commit .env files to Git**
⚠️ **Use strong SECRET_KEY in production**
⚠️ **DEBUG=False** in production

## Frontend Variables (Build Time)

These variables are required when building the Docker image for the frontend:

```env
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<domain>
VITE_FIREBASE_PROJECT_ID=<id>
VITE_FIREBASE_STORAGE_BUCKET=<bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<id>
```

**Note:** For Docker deployments, these must be passed as `args` or environment variables to the build context. The `docker-compose.prod.yml` is configured to read these from your `.env` file or Portainer environment.

## Getting Supab ase Keys

1. Go to https://supabase.com/dashboard
2. Select your project: `bfwrxznfgvsdcjznulon`
3. Settings → API
4. Copy **service_role** secret key (not anon public)
