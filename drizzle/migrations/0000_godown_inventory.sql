create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text not null default '',
  category text not null,
  size text not null default '',
  price numeric not null default 0,
  stock integer not null default 0 check (stock >= 0),
  color text not null default 'oklch(0.85 0.03 70)',
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  store_name text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  product_name text not null,
  model text not null default '',
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value text not null
);

-- Grants (Data API has no default privileges on public schema)
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select (id, name, created_at) on public.stores to anon, authenticated;
grant select on public.orders to anon, authenticated;
grant all on public.categories to service_role;
grant all on public.products to service_role;
grant all on public.stores to service_role;
grant all on public.orders to service_role;
grant all on public.app_settings to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stores enable row level security;
alter table public.orders enable row level security;
alter table public.app_settings enable row level security;

create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "public read products" on public.products for select to anon, authenticated using (true);
create policy "public read store names" on public.stores for select to anon, authenticated using (true);
create policy "public read orders" on public.orders for select to anon, authenticated using (true);
-- app_settings: no policies (service_role only)

-- Store login: verifies PIN without exposing it
create or replace function public.store_login(p_store_id uuid, p_pin text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select s.id from public.stores s where s.id = p_store_id and s.pin = p_pin;
$$;

-- Place order: transactional PIN check + stock deduction + order insert
create or replace function public.place_order(p_store_id uuid, p_pin text, p_product_id uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
  v_name text;
  v_model text;
begin
  if not exists (select 1 from public.stores where id = p_store_id and pin = p_pin) then
    raise exception 'Galat store ya PIN';
  end if;
  if p_qty is null or p_qty <= 0 or p_qty <> floor(p_qty) then
    raise exception 'Sahi quantity (peti) daalein';
  end if;
  select stock, name, model into v_stock, v_name, v_model from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Product nahi mila';
  end if;
  if p_qty > v_stock then
    raise exception 'Sirf % peti stock mein hai', v_stock;
  end if;
  update public.products set stock = stock - p_qty where id = p_product_id;
  insert into public.orders (store_id, store_name, product_id, product_name, model, qty)
    select p_store_id, s.name, p_product_id, v_name, v_model, p_qty
    from public.stores s where s.id = p_store_id;
  return v_stock - p_qty;
end;
$$;

grant execute on function public.store_login(uuid, text) to anon, authenticated;
grant execute on function public.place_order(uuid, text, uuid, integer) to anon, authenticated;

-- Live updates for all stores
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;

-- Seed data (demo PINs and tiles; admin can change everything later)
insert into public.categories (name) values
  ('Floor Tiles'), ('Wall Tiles'), ('Vitrified'), ('Bathroom'), ('Outdoor');

insert into public.stores (name, pin) values
  ('Store 1 - Main Market', '1111'),
  ('Store 2 - Station Road', '2222'),
  ('Store 3 - Ring Road', '3333');

insert into public.products (name, model, category, size, price, stock, color) values
  ('Statuario Marble Glossy', 'VT-6012', 'Vitrified', '600x1200', 1450, 100, 'oklch(0.93 0.01 80)'),
  ('Rustic Wood Plank', 'FL-2045', 'Floor Tiles', '200x1200', 980, 64, 'oklch(0.62 0.08 55)'),
  ('Moroccan Blue Pattern', 'WL-3310', 'Wall Tiles', '300x450', 720, 120, 'oklch(0.55 0.12 250)'),
  ('Anti-Skid Matt Grey', 'BT-1108', 'Bathroom', '300x300', 560, 15, 'oklch(0.6 0.01 250)'),
  ('Parking Stone Cobble', 'OD-7720', 'Outdoor', '400x400', 640, 210, 'oklch(0.5 0.03 60)'),
  ('Onyx Gold Polished', 'VT-6099', 'Vitrified', '800x1600', 2350, 40, 'oklch(0.82 0.08 85)');

insert into public.app_settings (key, value) values ('admin_pin', '0000');