// ============================================
// services/geminiService.ts - WITH FUNCTION CALLING
// ============================================

import { getSystemPrompt, buildFullPrompt } from '../utils/prompts.ts';
import { GEMINI_TOOLS } from '../utils/aiTools.ts';

// @ts-ignore - Deno.env is available in Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

export async function callGemini(context: any, userMessage: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const systemPrompt = await getSystemPrompt();
  const fullPrompt = await buildFullPrompt(context, userMessage);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: fullPrompt }]
          }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          // ⭐ ADD FUNCTION DECLARATIONS
          tools: [{
            functionDeclarations: GEMINI_TOOLS
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
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
    
    // ⭐ HANDLE FUNCTION CALLS
    const firstCandidate = data.candidates?.[0];
    const parts = firstCandidate?.content?.parts || [];
    
    const functionCalls: any[] = [];
    let textResponse = '';
    
    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args
        });
        console.log(`🔧 AI requested function: ${part.functionCall.name}`, part.functionCall.args);
      } else if (part.text) {
        textResponse += part.text;
      }
    }
    
    // PARSE TEXT RESPONSE
    let parsed: any;
    
    if (textResponse) {
      parsed = parseGeminiResponse(textResponse, context.products);
    } else {
      parsed = {
        response: '',
        type: 'none',
        product_ids: []
      };
    }
    
    const productCards = extractProductsByIds(context.products, parsed.product_ids);
    const tokens = Math.ceil((fullPrompt.length + textResponse.length) / 4);
    
    return {
      text: parsed.response,
      tokens: tokens,
      type: parsed.type,
      products: productCards,
      functionCalls: functionCalls
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
      products: [],
      functionCalls: []
    };
  }
}

// ⭐ NEW: Execute function call and get continuation
export async function callGeminiWithFunctionResult(
  context: any,
  userMessage: string,
  functionName: string,
  functionResult: any
) {
  // @ts-ignore - Deno.env is available
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const systemPrompt = await getSystemPrompt();
  const fullPrompt = await buildFullPrompt(context, userMessage);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: fullPrompt }]
            },
            {
              role: "model",
              parts: [{
                functionCall: {
                  name: functionName,
                  args: {}
                }
              }]
            },
            {
              role: "user",
              parts: [{
                functionResponse: {
                  name: functionName,
                  response: functionResult
                }
              }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          tools: [{
            functionDeclarations: GEMINI_TOOLS
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const parsed = parseGeminiResponse(textResponse, context.products);
    const productCards = extractProductsByIds(context.products, parsed.product_ids);
    const tokens = Math.ceil((fullPrompt.length + textResponse.length) / 4);
    
    return {
      text: parsed.response,
      tokens: tokens,
      type: parsed.type,
      products: productCards,
      functionCalls: []
    };
    
  } catch (error) {
    console.error('Gemini continuation failed:', error);
    return {
      text: 'Dạ em đã lưu thông tin rồi ạ! 📝',
      tokens: 0,
      type: 'none',
      products: [],
      functionCalls: []
    };
  }
}

// Keep all existing helper functions
function parseGeminiResponse(rawText: string, availableProducts: any[]) {
  try {
    const cleaned = rawText.trim();
    if (cleaned.startsWith('{')) {
      const parsed = JSON.parse(cleaned);
      return validateParsedResponse(parsed);
    }
  } catch (e) {
    console.log('Parse strategy 1 failed');
  }

  try {
    const match = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      return validateParsedResponse(parsed);
    }
  } catch (e) {
    console.log('Parse strategy 2 failed');
  }

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
    const uuidMatches = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
    if (uuidMatches && uuidMatches.length > 0) {
      productIds = uuidMatches;
    } else {
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