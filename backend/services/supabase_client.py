from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

# Client with anon key — respects RLS, used for auth operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Client with service role key — bypasses RLS, used for server-side operations
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
