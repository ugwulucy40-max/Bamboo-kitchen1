/*=========================================
    Bamboo Kitchen
    Supabase Configuration
=========================================*/

// Replace these with your own Supabase details
const SUPABASE_URL = "https://kctatjegmbydczpgmkdd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WIqYX5A6mVIN5aqgjkg3lg_W1g16hDu";

// Create the Supabase client
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);