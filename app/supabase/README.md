# Commons setup (Supabase)

Commons is optional. Without these steps Forma runs as before, with Commons switched off.

1. Create a project at supabase.com (the free tier is enough for a class).
2. **SQL editor:** run `migrations/20261001000000_commons.sql`.
3. **SQL editor:** create the course community. Pick your own join code (at least 8 characters) and share it only with classmates:
   ```sql
   insert into public.communities (course_id, join_code) values ('em1', 'your-join-code');
   ```
4. **Authentication → Email Templates → Magic Link:** make the body include the one-time code, for example `<p>Your Forma code: <strong>{{ .Token }}</strong></p>`. Forma signs in with the code, so no redirect URL is needed.
5. Copy `apps/web/.env.example` to `apps/web/.env.local`. Fill in the values from Project Settings → API:
   - the project URL;
   - the anon key;
   - the service-role key (server only).
6. Sign in once at `/commons` and join with the code. Then make yourself the owner (Authentication → Users shows your user id):
   ```sql
   update public.course_members set role = 'owner' where course_id = 'em1' and user_id = 'your-user-id';
   ```
