# ============================================
# CHATBOT REFACTOR - AUTO SETUP SCRIPT (WINDOWS)
# ============================================

Write-Host "[START] Chatbot Refactor Setup..." -ForegroundColor Green
Write-Host ""

# Step 1: Create folder structure
Write-Host "[STEP 1] Creating folder structure..." -ForegroundColor Cyan

$folders = @(
    "supabase",
    "supabase\functions",
    "supabase\functions\chatbot-process",
    "supabase\functions\chatbot-process\handlers",
    "supabase\functions\chatbot-process\services",
    "supabase\functions\chatbot-process\utils"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  [OK] Created: $folder" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] Exists: $folder" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[STEP 2] Creating files..." -ForegroundColor Cyan

# Step 2: Create utils/cors.ts
$corsContent = @"
// ============================================
// utils/cors.ts - CORS headers
// ============================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
"@

Set-Content -Path "supabase\functions\chatbot-process\utils\cors.ts" -Value $corsContent -Encoding UTF8
Write-Host "  [OK] Created: utils/cors.ts" -ForegroundColor Green

# Step 3: Create utils/supabaseClient.ts
$supabaseClientContent = @"
// ============================================
// utils/supabaseClient.ts - Supabase client factory
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
"@

Set-Content -Path "supabase\functions\chatbot-process\utils\supabaseClient.ts" -Value $supabaseClientContent -Encoding UTF8
Write-Host "  [OK] Created: utils/supabaseClient.ts" -ForegroundColor Green

# Step 4: Create utils/formatters.ts
$formattersContent = @"
// ============================================
// utils/formatters.ts - Format utilities
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateCost(tokens: number): number {
  return tokens * 0.4 / 1_000_000 * 0.125 + tokens * 0.6 / 1_000_000 * 0.375;
}
"@

Set-Content -Path "supabase\functions\chatbot-process\utils\formatters.ts" -Value $formattersContent -Encoding UTF8
Write-Host "  [OK] Created: utils/formatters.ts" -ForegroundColor Green

# Step 5: Create utils/prompts.ts
$promptsContent = @'
// ============================================
// utils/prompts.ts - System prompts
// ============================================

import { formatPrice } from './formatters.ts';

export function getSystemPrompt(): string {
  return `Ban la tro ly ao BeWo Store - shop thoi trang.

QUY TAC:
- Tra loi ngan gon 2-3 cau
- Khi TU VAN san pham cu the: type="showcase" + product_ids
- Khi chi NHAC DEN san pham: type="mention" + product_ids=[]
- Cau hoi chung: type="none" + product_ids=[]

QUAN TRONG: Chi tra ve JSON, khong them text nao khac!`;
}

export function buildFullPrompt(
  systemPrompt: string,
  context: any,
  userMessage: string
): string {
  let conversationHistory = '';
  if (context.history && context.history.length > 0) {
    conversationHistory = '\nLICH SU:\n';
    context.history.forEach((msg: any) => {
      const role = msg.sender_type === 'customer' ? 'KHACH' : 'BOT';
      conversationHistory += `${role}: ${msg.content.text}\n`;
    });
  }

  let productsInfo = '';
  if (context.products && context.products.length > 0) {
    productsInfo = '\nDANH SACH SAN PHAM:\n';
    context.products.slice(0, 15).forEach((p: any, idx: number) => {
      productsInfo += `${idx + 1}. ID: ${p.id}\n   Ten: ${p.name}\n   Gia: ${formatPrice(p.price)}\n\n`;
    });
  }

  return `${systemPrompt}\n${conversationHistory}\n${productsInfo}\n\nKHACH: "${userMessage}"`;
}
'@

Set-Content -Path "supabase\functions\chatbot-process\utils\prompts.ts" -Value $promptsContent -Encoding UTF8
Write-Host "  [OK] Created: utils/prompts.ts" -ForegroundColor Green

# Step 6: Create README
$readmeContent = @"
# Chatbot Refactor - Setup Complete!

## What was created:

Folders:
- supabase/functions/chatbot-process/handlers/
- supabase/functions/chatbot-process/services/
- supabase/functions/chatbot-process/utils/

Files:
- utils/cors.ts
- utils/supabaseClient.ts
- utils/formatters.ts
- utils/prompts.ts

## Next Steps:

1. Ask Claude to create remaining service files:
   - services/contextService.ts
   - services/geminiService.ts
   - services/facebookService.ts

2. Ask Claude to create handler files:
   - handlers/messageHandler.ts
   - handlers/orderTrackingHandler.ts
   - handlers/quickReplyHandler.ts

3. Update index.ts with new orchestrator code

4. Test locally:
   supabase functions serve chatbot-process

5. Deploy:
   supabase functions deploy chatbot-process
"@

Set-Content -Path "supabase\functions\chatbot-process\README.md" -Value $readmeContent -Encoding UTF8
Write-Host "  [OK] Created: README.md" -ForegroundColor Green

Write-Host ""
Write-Host "[SUCCESS] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Created 6 folders" -ForegroundColor White
Write-Host "  - Created 5 files (4 utils + 1 README)" -ForegroundColor White
Write-Host ""
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "  1. Open README.md" -ForegroundColor White
Write-Host "  2. Ask Claude for remaining files" -ForegroundColor White
Write-Host ""
Write-Host "Location: supabase/functions/chatbot-process/" -ForegroundColor Yellow
Write-Host ""