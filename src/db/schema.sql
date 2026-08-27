create table if not exists providers (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

insert into providers (id, name)
values ('openai', 'OpenAI'), ('anthropic', 'Anthropic'), ('gemini', 'Google Gemini'), ('mistral', 'Mistral AI'), ('cohere', 'Cohere'), ('groq', 'Groq'), ('deepseek', 'DeepSeek'), ('perplexity', 'Perplexity'), ('together', 'Together AI'), ('openrouter', 'OpenRouter')
on conflict (id) do nothing;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists api_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  provider_id text references providers(id) not null,
  encrypted_key text not null,
  label text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  provider_id text references providers(id) not null,
  snapshot_date date not null,
  cost_usd numeric(10,4) not null default 0,
  input_tokens bigint default 0,
  output_tokens bigint default 0,
  model text,
  raw_response jsonb,
  fetched_at timestamptz default now(),
  unique (user_id, provider_id, snapshot_date, model)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  provider_id text references providers(id) not null,
  monthly_limit_usd numeric(10,2) not null,
  alert_at_percent int default 80,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, provider_id)
);

create table if not exists alerts_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  provider_id text references providers(id) not null,
  alert_type text not null,
  month text not null,
  sent_at timestamptz default now(),
  unique (user_id, provider_id, alert_type, month)
);

-- Safe migrations for existing DBs
ALTER TABLE api_credentials ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
ALTER TABLE usage_snapshots ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);
ALTER TABLE alerts_sent ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id);

ALTER TABLE usage_snapshots ADD COLUMN IF NOT EXISTS project_tag text DEFAULT 'default';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS alert_thresholds integer[] DEFAULT '{50, 80, 100}';

ALTER TABLE usage_snapshots DROP CONSTRAINT IF EXISTS usage_snapshots_provider_id_snapshot_date_model_key;
ALTER TABLE usage_snapshots DROP CONSTRAINT IF EXISTS usage_snapshots_user_id_provider_id_snapshot_date_model_key;
ALTER TABLE usage_snapshots DROP CONSTRAINT IF EXISTS usage_snapshots_unique_full;
ALTER TABLE usage_snapshots ADD CONSTRAINT usage_snapshots_unique_full UNIQUE (user_id, provider_id, snapshot_date, model, project_tag);

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_provider_id_key;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_provider_id_key;
ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_provider_id_key UNIQUE (user_id, provider_id);

create index if not exists idx_usage_snapshots_date on usage_snapshots (snapshot_date desc);
create index if not exists idx_usage_snapshots_provider on usage_snapshots (provider_id, snapshot_date desc);
