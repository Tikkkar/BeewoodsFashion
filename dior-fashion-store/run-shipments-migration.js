import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting Shipments Auto-Sync Migration...\n');
    console.log('📝 Reading SQL file...\n');

    try {
        const sqlContent = readFileSync('./migrations/auto_sync_shipments.sql', 'utf-8');

        console.log('✅ SQL file loaded successfully');
        console.log('\n' + '='.repeat(70));
        console.log('⚠️  IMPORTANT: This script requires SUPABASE SERVICE ROLE KEY');
        console.log('='.repeat(70));
        console.log('\nPlease run this migration using one of these methods:\n');
        console.log('1. 📊 Supabase Dashboard > SQL Editor');
        console.log('   - Copy the content from migrations/auto_sync_shipments.sql');
        console.log('   - Paste into SQL Editor and run\n');
        console.log('2. 🔧 Supabase CLI:');
        console.log('   supabase db execute -f migrations/auto_sync_shipments.sql\n');
        console.log('3. 🐘 PostgreSQL CLI (psql):');
        console.log('   psql "YOUR_CONNECTION_STRING" -f migrations/auto_sync_shipments.sql\n');
        console.log('='.repeat(70));
        console.log('\n📖 See migrations/README.md for detailed instructions\n');

        // Try to at least verify connection
        const { data, error } = await supabase.from('shipments').select('count').limit(1);

        if (error) {
            console.error('❌ Cannot connect to Supabase:', error.message);
        } else {
            console.log('✅ Supabase connection verified');
            console.log('\n💡 You can now run the migration using the methods above');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runMigration();
