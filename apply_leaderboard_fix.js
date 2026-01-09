// Script to apply the leaderboard fix migration
// Run with: node apply_leaderboard_fix.js

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Make sure .env.local is configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying leaderboard fix migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/012_fix_leaderboard_ambiguous_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, we'll need to run it manually
      console.log('ℹ️  Cannot run SQL directly via API.');
      console.log('   Please run the migration manually in Supabase SQL Editor.\n');
      console.log('📋 Copy the following SQL and paste it in your Supabase SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      console.log('\n📍 Steps:');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Click on "SQL Editor" in the left sidebar');
      console.log('   3. Click "New query"');
      console.log('   4. Paste the SQL above');
      console.log('   5. Click "Run"\n');
      return;
    }

    console.log('✅ Migration applied successfully!');
    
    // Test the functions
    console.log('\n🧪 Testing the fixed functions...');
    
    const { data: salesData, error: salesError } = await supabase.rpc('get_top_sellers_by_sales', { p_limit_count: 10 });
    if (salesError) {
      console.log('❌ get_top_sellers_by_sales error:', salesError.message);
    } else {
      console.log('✅ get_top_sellers_by_sales works! Found', salesData?.length || 0, 'sellers');
    }

    const { data: viewsData, error: viewsError } = await supabase.rpc('get_top_sellers_by_views', { p_limit_count: 10 });
    if (viewsError) {
      console.log('❌ get_top_sellers_by_views error:', viewsError.message);
    } else {
      console.log('✅ get_top_sellers_by_views works! Found', viewsData?.length || 0, 'sellers');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

applyMigration();

