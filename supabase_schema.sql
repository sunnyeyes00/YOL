create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text check (category in ('Home', 'Digital')) not null,
  location text,
  estimated_value numeric(10,2),
  condition text check (condition in ('Excellent', 'Good', 'Fair', 'Poor')),
  decision text check (decision in ('Keep', 'Sell', 'Donate', 'Toss', 'Undecided')) default 'Undecided',
  poshmark boolean default false,
  poshmark_listing text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table items enable row level security;

-- Allow all operations for anon (for demo purposes)
create policy "Allow all for anon" on items
  for all using (true) with check (true);
