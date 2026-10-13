# Cloud AI script generation

The cloud endpoint uses Vercel AI Gateway via deployed OIDC credentials. AI_SCRIPT_ENABLED defaults to false. AI_GATEWAY_MODEL is selected from the live model catalog. AI_OWNER_EMAIL restricts generation to a confirmed owner email.

Before enabling: verify AI Gateway account access and credits, set AI_SCRIPT_ENABLED=true in Vercel, and redeploy. Each UI generation requires explicit credit confirmation. No live AI generation was executed during setup. ChatGPT subscription does not provide this application's API credits.

Scripts are stored in the owner's existing Supabase draft row. A conditional status update prevents concurrent requests for the same draft. Failed requests preserve the saved topic. Interrupted requests can leave a generating status, which the operator must reconcile before retrying. The endpoint does not render or upload a video.

Schema addition applied to the hosted database:
```sql
alter table public.agenttube_drafts add column script text,
add column script_status text not null default 'pending' check(script_status in ('pending','generating','ready','failed')),
add column script_generated_at timestamptz,
add column script_model text;
```
