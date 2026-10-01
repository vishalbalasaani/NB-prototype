# Supabase Edge Functions

This directory is reserved for Supabase Edge Functions (Deno / TypeScript).

NodeBricks currently utilizes server-side Next.js Route Handlers (`src/app/api/...`) running in standard server environments for attendance synchronization, marks calculation, and WhatsApp notifications.

If future cloud-scale background tasks (e.g., cron-scheduled automated WhatsApp batches or database webhooks) are delegated to Supabase Edge Functions, add them as subdirectories here.
