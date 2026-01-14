-- Add user_id to meetings (if not exists, though usually we'd do alter table)
-- Since this is an MVP/new project, I'll provide the full CREATE statement update or ALTER
-- Let's do ALTER to be safe if table exists

-- Add user_id column
alter table meetings add column user_id uuid references auth.users(id) not null;

-- Enable RLS
alter table meetings enable row level security;
alter table action_items enable row level security;

-- Create Policies
create policy "Users can view own meetings" on meetings
  for select using (auth.uid() = user_id);

create policy "Users can insert own meetings" on meetings
  for insert with check (auth.uid() = user_id);

create policy "Users can view own action items" on action_items
  for select using (
    exists (
      select 1 from meetings
      where meetings.id = action_items.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

-- Assuming action items insertion is handled by server-side logic effectively via service role or same user context
-- If logic runs as user, we need insert policy too.
-- For now, let's assume the API route will pass the user_id context or we rely on the meeting ownership.
