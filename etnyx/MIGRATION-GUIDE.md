# Storage Migration Guide: Supabase Storage → Cloudflare R2

## Status

| Item | Status |
|------|--------|
| R2 Library (`src/lib/r2.ts`) | ✅ Implemented |
| Upload Routes (R2 + Supabase fallback) | ✅ Migrated |
| Health Check Endpoint | ✅ Updated |
| R2 Env Vars in Vercel | ✅ Configured |
| R2 Public Access | ✅ Enabled |
| Migration Script | ✅ Created |
| Dry-Run Scan | ✅ Completed |
| **Actual Migration** | ⏳ Pending (needs local R2 creds) |

## Dry-Run Results

```
Bucket "payment-proofs":     54 files (17.84 MB)
Bucket "worker-screenshots": 33 files (3.24 MB)
─────────────────────────────────────────────────
Total:                       87 files (21.08 MB)
```

## Steps to Execute Migration

### 1. Add R2 Credentials to Local `.env.local`

Add these lines to `etnyx/.env.local` (get values from Cloudflare Dashboard > R2):

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=etnyx-storage
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### 2. Run Migration

```bash
cd etnyx

# Full migration (files + database URLs)
node scripts/migrate-storage-to-r2.mjs --execute

# OR: Files only, skip DB update
node scripts/migrate-storage-to-r2.mjs --execute --skip-db
```

### 3. Verify

```bash
# Check health endpoint (should show provider: "r2")
curl http://localhost:3000/api/health | jq '.services.storage'
```

### 4. Post-Migration Cleanup (Optional, after verifying everything works)

After confirming all R2 URLs work correctly:

1. Delete old files from Supabase Storage buckets (manual, via Supabase Dashboard)
2. Remove Supabase Storage fallback code from upload routes (optional)

## Safety Features

- **No deletion**: Script NEVER deletes files from Supabase Storage
- **Idempotent**: Can re-run safely (skips files already in R2)
- **Per-file error handling**: One failure doesn't stop others
- **Verification**: Each uploaded file is verified via HTTP HEAD before marking as migrated
- **DB update**: Two-pass strategy (exact match + broad sweep) ensures all URLs are updated

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Upload Route                     │
│  (e.g., /api/admin/portfolio/upload)             │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              src/lib/r2.ts                       │
│  isR2Configured() → true?                       │
│     ├── YES → uploadToR2()                      │
│     └── NO  → uploadToSupabase() (fallback)     │
└──────────────────────────────────────────────────┘
```

## Cost Comparison

| Metric | Supabase Storage (Free) | Cloudflare R2 (Free) |
|--------|------------------------|---------------------|
| Storage | 1 GB | 10 GB |
| Egress | 1 GB/month | **Unlimited (Zero Egress)** |
| Operations A | Unlimited | 1M/month (Class A) |
| Operations B | Unlimited | 10M/month (Class B) |

**Verdict**: R2 wins on every metric for free tier. Zero egress fees is the killer feature — especially for payment proof screenshots and worker screenshots that are frequently accessed.