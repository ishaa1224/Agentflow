import os
from supabase import create_client, Client
from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Dummy dependency to avoid breaking FastAPI routes that use `Depends(get_db)`
# Or you can remove `Depends(get_db)` in main.py, which we will do shortly.
def init_db():
    pass

def get_db():
    pass
