-- New signups must never choose their own role. Previously handle_new_user
-- honored raw_user_meta_data.role, so anyone could self-signup as an admin by
-- passing {"role":"admin"} in the signup options. Admins are promoted manually.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'client'
  );
  return new;
end;
$$;
