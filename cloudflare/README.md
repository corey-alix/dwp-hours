# Cloudflare Deployment for DWP Hours Tracker

This directory contains the Cloudflare Workers + Durable Objects implementation of the DWP Hours Tracker API.

## Architecture

- **Cloudflare Pages**: Serves the static frontend (HTML, CSS, JS)
- **Cloudflare Workers**: Handles API requests and routing
- **Durable Objects**: Maintains in-memory SQLite database with persistence to R2
- **R2 Storage**: Stores the SQLite database file
- **SendGrid**: Handles email delivery for magic links

## Key Differences from Express Server

1. **Stateless Workers**: Each request gets a fresh instance
2. **Durable Objects**: Single-threaded, persistent state for database operations
3. **R2 Storage**: Database file persistence instead of local filesystem
4. **Web Crypto API**: Uses `crypto.subtle` instead of Node.js crypto
5. **Fetch API**: All HTTP requests use the Fetch API

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler auth login
```

### 3. Create R2 Bucket

```bash
# Create the bucket for database storage
wrangler r2 bucket create dwp-hours-db
```

### 4. Set Secrets

```bash
# Set SendGrid API key
wrangler secret put SENDGRID_API_KEY

# When prompted, enter your SendGrid API key
```

### 5. Configure Environment

Update `wrangler.toml` with your actual values:

- `FROM_EMAIL`: Your verified sender email
- `HASH_SALT`: A secure random string for token generation

### 6. Deploy

```bash
# Deploy to production
wrangler deploy

# Or deploy to dev environment
wrangler deploy --env dev
```

## CORS Configuration

The Durable Object includes CORS headers. For production, update the `corsHeaders` in `handleSession()`:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://yourapp.pages.dev", // Your Pages domain
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
};
```

## Database Persistence

- Database loads from R2 on first request
- TypeORM `autoSave: true` triggers saves after writes
- Manual saves via `saveDatabaseToR2()` method
- Consider implementing periodic saves using Durable Object alarms

## Development

### Local Development

```bash
# Start local development server
wrangler dev

# The API will be available at http://localhost:8787
```

### Testing

```bash
# Run tests against local worker
curl -X GET http://localhost:8787/api/health
```

## Deployment Checklist

- [ ] Cloudflare account with Workers enabled
- [ ] R2 bucket created (`dwp-hours-db`)
- [ ] SendGrid account and API key configured
- [ ] Domain configured for Pages (if using custom domain)
- [ ] Environment variables set in `wrangler.toml`
- [ ] Secrets configured via `wrangler secret put`
- [ ] CORS origins configured for your Pages domain
- [ ] Database schema accessible (currently fetches from deployment URL)

## Limitations

1. **Memory Limits**: Durable Objects have 128MB memory limit
2. **Single Threading**: All requests to a DO are serialized
3. **Cold Starts**: Database loads from R2 on first request
4. **TypeORM Compatibility**: May need adjustments for Workers environment

## Next Steps

1. Implement remaining API routes (employees, hours, acknowledgements)
2. Add authentication middleware for protected routes
3. Implement periodic database saves using DO alarms
4. Add comprehensive error handling and logging
5. Set up monitoring and analytics
6. Configure custom domain and SSL certificates
