// ============================================
// services/geminiService.ts - Gemini AI integration
// ============================================

import { getSystemPrompt, buildFullPrompt } from '../utils/prompts.ts';

// @ts-ignore - Deno.env is available in Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

export async function callGemini(context: any, userMessage: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // ✅ SỬA: Thêm await cho cả 2 hàm async
  const systemPrompt = await getSystemPrompt();
  const fullPrompt = await buildFullPrompt(context, userMessage);
  // 🔍 DEBUG - QUAN TRỌNG
  console.log('=== DEBUG PROMPT ===');
  console.log('systemPrompt type:', typeof systemPrompt);
  console.log('systemPrompt preview:', String(systemPrompt).substring(0, 50));
  
  console.log('fullPrompt type:', typeof fullPrompt);
  console.log('fullPrompt preview:', String(fullPrompt).substring(0, 50));
  console.log('Calling Gemini API...');
  console.log('Prompt type:', typeof fullPrompt); // ← Debug log
  console.log('Prompt length:', fullPrompt.length);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user", // ← Thêm role
            parts: [{ text: fullPrompt }]
          }],
          // ✅ KHUYẾN NGHỊ: Tách system instruction riêng
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: "application/json" // ← Bắt buộc trả JSON
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini response received:', rawText.substring(0, 100) + '...');

    // Parse response
    const parsed = parseGeminiResponse(rawText, context.products);

    // Extract product cards
    const productCards = extractProductsByIds(context.products, parsed.product_ids);

    const tokens = Math.ceil((fullPrompt.length + rawText.length) / 4);

    return {
      text: parsed.response,
      tokens: tokens,
      type: parsed.type,
      products: productCards
    };
  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('Gemini call failed:', errorMessage);

    return {
      text: 'Xin lỗi, em đang gặp sự cố kỹ thuật. Vui lòng thử lại sau ạ 🌷',
      tokens: 0,
      type: 'none',
      products: []
    };
  }
}

function parseGeminiResponse(rawText: string, availableProducts: any[]) {
  // Strategy 1: Direct JSON parse
  try {
    const cleaned = rawText.trim();
    if (cleaned.startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      return validateParsedResponse(parsed);
    }
  } catch (e) {
    console.log('Parse strategy 1 failed');
  }

  // Strategy 2: Extract from code block
  try {
    const match = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      return validateParsedResponse(parsed);
    }
  } catch (e) {
    console.log('Parse strategy 2 failed');
  }

  // Strategy 3: Find JSON object
  try {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = rawText.substring(start, end + 1);
      const parsed = JSON.parse(jsonStr);
      return validateParsedResponse(parsed);
    }
  } catch (e) {
    console.log('Parse strategy 3 failed');
  }

  // Strategy 4: Manual fallback
  console.log('Using manual fallback parser');
  return manualParse(rawText, availableProducts);
}

function validateParsedResponse(parsed: any) {
  return {
    response: parsed.response || parsed.text || '',
    type: ['none', 'mention', 'showcase'].includes(parsed.type) 
      ? parsed.type 
      : parsed.response_type || 'none',
    product_ids: Array.isArray(parsed.product_ids) 
      ? parsed.product_ids 
      : parsed.recommended_product_ids || []
  };
}

function manualParse(text: string, products: any[]) {
  const textLower = text.toLowerCase();
  
  let type = 'none';
  const showcaseKeywords = ['cho toi xem', 'goi y', 'khuyen', 'tu van', 'co khong', 'co gi', 'mua gi', 'xem thu'];
  const hasShowcaseIntent = showcaseKeywords.some(kw => textLower.includes(kw));
  const hasPrice = /\d{1,3}[.,]?\d{3}/.test(text);
  const mentionsProduct = /ao|quan|vay|giay|tui|dam|so mi|jean|hoodie|polo/.test(textLower);

  if (hasShowcaseIntent || (mentionsProduct && hasPrice)) {
    type = 'showcase';
  } else if (mentionsProduct) {
    type = 'mention';
  }

  let productIds: string[] = [];
  if (type === 'showcase') {
    // Extract UUIDs
    const uuidMatches = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
    if (uuidMatches && uuidMatches.length > 0) {
      productIds = uuidMatches;
    } else {
      // Match by product names
      const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
      for (const product of sortedProducts) {
        const productNameLower = product.name.toLowerCase();
        const nameWords = productNameLower.split(' ');
        const matchCount = nameWords.filter((word: string) => 
          word.length > 2 && textLower.includes(word)
        ).length;

        if (matchCount >= nameWords.length * 0.5) {
          productIds.push(product.id);
          if (productIds.length >= 3) break;
        }
      }

      // Fallback: return top products
      if (productIds.length === 0 && products.length > 0) {
        productIds = products.slice(0, 3).map(p => p.id);
      }
    }
  }

  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
    .trim();

  return {
    response: cleaned || text,
    type: type,
    product_ids: productIds
  };
}

function extractProductsByIds(availableProducts: any[], productIds: string[] = []) {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  const recommendations: any[] = [];
  for (const id of productIds) {
    const product = availableProducts.find((p: any) => p.id === id);
    if (product && !recommendations.find((r: any) => r.id === product.id)) {
      recommendations.push(product);
      if (recommendations.length >= 5) break;
    }
  }

  console.log(`Extracted ${recommendations.length}/${productIds.length} products`);
  return recommendations;
}