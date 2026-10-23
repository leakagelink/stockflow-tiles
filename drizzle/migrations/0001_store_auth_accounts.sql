-- Har store staff member ka apna account; user ko store se jodta hai
create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

grant select on public.store_members to authenticated;
grant all on public.store_members to service_role;

alter table public.store_members enable row level security;

create policy "members read own rows" on public.store_members
  for select to authenticated using (auth.uid() = user_id);

-- Order placement ab logged-in user ke store se hota hai (PIN nahi)
create or replace function public.place_order_auth(p_product_id uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_stock integer;
  v_name text;
  v_model text;
begin
  select store_id into v_store_id from public.store_members where user_id = auth.uid() limit 1;
  if v_store_id is null then
    raise exception 'Aapka account kisi store se juda nahi hai — admin se store assign karwayein';
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
    select v_store_id, s.name, p_product_id, v_name, v_model, p_qty
    from public.stores s where s.id = v_store_id;
  return v_stock - p_qty;
end;
$$;

grant execute on function public.place_order_auth(uuid, integer) to authenticated;

-- Purana PIN system retire ho gaya; functions/column rakhe gaye hain par app use nahi karti
comment on function public.store_login(uuid, text) is 'DEPRECATED: replaced by email/password auth + store_members';
comment on function public.place_order(uuid, text, uuid, integer) is 'DEPRECATED: replaced by place_order_auth';
comment on column public.stores.pin is 'DEPRECATED: store login ab email/password accounts se hota hai';