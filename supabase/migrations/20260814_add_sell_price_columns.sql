alter table public.prices
  add column if not exists sell_price numeric,
  add column if not exists sell_rate numeric;
