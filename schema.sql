-- Create Meetings Table
create table meetings (
  id uuid default gen_random_uuid() primary key,
  title text not null default 'New Meeting',
  summary text,
  transcript text,
  key_decisions text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Action Items Table
create table action_items (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id) on delete cascade not null,
  task text not null,
  assignee text default 'Unknown',
  deadline text,
  priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
