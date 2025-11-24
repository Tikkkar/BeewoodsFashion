-- Function to increment product view count
create or replace function increment_product_view(product_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update products
  set view_count = view_count + 1
  where id = product_id;
end;
$$;
