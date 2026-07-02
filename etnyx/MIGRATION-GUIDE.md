# Supabase Schema Migration Index

> ** canonical reference** — Documents the correct execution order and purpose of all migration files.

## Quick Start (Fresh Database)

If you're setting up a **new** Supabase project from scratch, run these files in order:

1. `supabase-schema.sql` — Base schema (tables, indexes, triggers)
2. `supabase-schema-v2.sql` through `supabase-schema-v25-moota.sql` — Incremental updates
3. `supabase-schema-v26-rls-hardening.sql` — **CRITICAL: RLS security hardening**
4. `supabase-schema-v27-promo-placement.sql` — Promo code placement feature
5. `supabase-schema-v28-indexes.sql` — Performance indexes

Or simply run: `supabase-schema-consolidated.sql` (contains base tables + all migrations through v25).

Then run v26, v27, v28 on top.

## Migration Inventory

| Version | File | Purpose | Breaking? |
|---------|------|---------|-----------|
| base | `supabase-schema.sql` | Initial table creation | — |
| v2 | `supabase-schema-v2.sql` | Pricing table updates | No |
| v3 | `supabase-schema-v3.sql` | Order status enum update | No |
| v4 | `supabase-schema-v4.sql` | Staff/worker tables | No |
| v8–v25 | `supabase-schema-v{N}.sql` | Incremental feature additions | No |
| v21-fix | `supabase-schema-v21-fix-passwords.sql` | Password hash fix | Patch |
| v22-reset | `supabase-schema-v22-reset-staff.sql` | Staff table reset | ⚠️ Destructive |
| v23 | `supabase-schema-v23-cron-columns.sql` | Cron job columns | No |
| v24 | `supabase-schema-v24-logic-fixes.sql` | Business logic fixes | No |
| v25 | `supabase-schema-v25-moota.sql` | Moota integration | No |
| **v26** | `supabase-schema-v26-rls-hardening.sql` | **🔒 RLS hardening (CRITICAL)** | Security |
| v27 | `supabase-schema-v27-promo-placement.sql` | Promo banner placement | No |
| v28 | `supabase-schema-v28-indexes.sql` | Query performance indexes | No |

## Key Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `orders` | Customer joki orders | ✅ Service-role only |
| `pricing_config` | Dynamic pricing (CMS-driven) | ✅ Public read (non-secret) |
| `settings` | App configuration key-values | ✅ Public read (filtered) |
| `testimonials` | Customer reviews | ✅ Public read (approved only) |
| `portfolio` | Past work showcase | ✅ Public read (active only) |
| `promo_codes` | Discount codes | ✅ Public read (active only) |
| `staff` | Admin/worker accounts | ✅ Service-role only |
| `activity_log` | Audit trail | ✅ Service-role only |
| `payment_methods` | Bank/e-wallet config | ✅ Service-role only |

## RLS Policy Summary (v26)

- **Service role**: Full CRUD on ALL tables (server-side operations)
- **anon/authenticated**: SELECT only on "safe" public tables:
  - `testimonials` WHERE `is_approved = true`
  - `portfolio` WHERE `is_active = true`
  - `reviews` WHERE `is_approved = true`
  - `settings` WHERE key NOT LIKE `secret_%` / `%_api_key` / `%_token` / `%_secret`
  - `promo_codes` WHERE `is_active = true AND not expired`
- **All other tables**: Blocked for anon/authenticated (writes go through API routes)

## Verification Queries

After running all migrations, verify RLS is active:

```sql
-- Check all tables have RLS enabled + forced
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policies
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test: should return 0 rows with anon key
-- SELECT * FROM orders LIMIT 1;
```

## Notes

- Migration files are **append-only** — never edit a previous migration
- Each migration is idempotent (safe to re-run)
- The `supabase-cleanup-duplicate-workers.sql` file is a one-time fix script
- `seed-data.sql` contains optional demo/seed data