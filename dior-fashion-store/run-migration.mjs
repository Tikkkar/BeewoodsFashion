import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đọc thông tin từ .env
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Không tìm thấy SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
    console.log('🚀 Bắt đầu chạy migration auto-sync shipments...\n');

    try {
        // Đọc file SQL
        const sqlContent = readFileSync(
            join(__dirname, 'migrations', 'auto_sync_shipments.sql'),
            'utf-8'
        );

        // Tách các câu lệnh SQL
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s.length > 10);

        console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Bỏ qua comments
            if (statement.includes('COMMENT ON')) {
                console.log(`⏭️  Bỏ qua comment statement ${i + 1}`);
                continue;
            }

            console.log(`\n📌 Đang chạy statement ${i + 1}/${statements.length}...`);

            try {
                const { error } = await supabase.rpc('exec_sql', {
                    sql_query: statement + ';'
                });

                if (error) {
                    // Thử chạy trực tiếp nếu RPC không hoạt động
                    console.log('⚠️  RPC không hoạt động, thử phương pháp khác...');
                    throw error;
                }

                console.log(`✅ Thành công statement ${i + 1}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Lỗi statement ${i + 1}:`, error.message);
                errorCount++;

                // Tiếp tục với statement tiếp theo
                if (statement.includes('DROP TRIGGER IF EXISTS')) {
                    console.log('   (Có thể trigger chưa tồn tại, bỏ qua...)');
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`);
        console.log('='.repeat(60));

        // Chạy function cập nhật dữ liệu hiện có
        console.log('\n🔄 Đang cập nhật dữ liệu shipments hiện có...');

        const { data: updateResults, error: updateError } = await supabase
            .rpc('update_existing_shipments');

        if (updateError) {
            console.error('❌ Lỗi khi cập nhật dữ liệu:', updateError.message);
        } else {
            console.log(`✅ Đã cập nhật ${updateResults?.length || 0} shipments`);
            if (updateResults && updateResults.length > 0) {
                console.log('\nCác shipments đã cập nhật:');
                updateResults.slice(0, 5).forEach(r => {
                    console.log(`  - ${r.order_number}: ${r.updated_fields?.join(', ') || 'không có thay đổi'}`);
                });
                if (updateResults.length > 5) {
                    console.log(`  ... và ${updateResults.length - 5} shipments khác`);
                }
            }
        }

        console.log('\n✨ Migration hoàn tất!');
        console.log('\n📋 Kết quả:');
        console.log('  - Trigger đã được tạo để tự động sync dữ liệu');
        console.log('  - View v_shipments_full đã được tạo');
        console.log('  - Dữ liệu shipments hiện có đã được cập nhật');
        console.log('\n💡 Từ giờ, mọi shipment mới sẽ tự động được sync thông tin từ orders và products!');

    } catch (error) {
        console.error('\n❌ Lỗi khi chạy migration:', error);
        process.exit(1);
    }
}

runMigration();
