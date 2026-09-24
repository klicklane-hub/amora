create or replace view public.discoverable_profiles
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  extract(year from age(current_date::timestamp with time zone, p.date_of_birth::timestamp with time zone))::integer as age,
  p.bio,
  p.country_code,
  case when coalesce(ps.show_approximate_location, true) then p.city else null end as city,
  p.interests,
  p.languages,
  p.avatar_url,
  p.role,
  p.show_online_status,
  p.allow_messages,
  p.allow_calls,
  p.allow_invitations,
  p.verification_status,
  p.last_seen_at
from public.profiles p
left join public.privacy_settings ps on ps.user_id = p.id
where p.status = 'active'::account_status
  and p.visibility = 'discoverable'::profile_visibility
  and p.is_age_confirmed = true
  and p.date_of_birth is not null
  and coalesce(ps.discoverable_by_default, true) = true
  and not exists (
    select 1
    from public.blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = p.id)
       or (b.blocked_id = (select auth.uid()) and b.blocker_id = p.id)
  );