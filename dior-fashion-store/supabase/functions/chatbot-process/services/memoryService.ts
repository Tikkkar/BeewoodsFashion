// ============================================
// services/memoryService.ts - Memory Management
// ============================================

import { createSupabaseClient } from '../utils/supabaseClient.ts';

// --- TYPE DEFINITIONS (Định nghĩa kiểu dữ liệu) ---

// Kiểu dữ liệu cho phản hồi của Gemini/AI sau khi xử lý
type AIResponse = {
    text: string;
    tokens: number;
    type: string;
    products: { id: string }[]; // Giả sử products có ít nhất thuộc tính id
};

// Kiểu dữ liệu cho các phần tử tin nhắn từ Supabase
type Message = {
    content: {
        text: string;
    };
    sender_type: string; // 'customer' | 'bot'
    created_at: string;
};

// --- CORE FUNCTIONS ---

/**
 * Get or create customer profile
 */
export async function getOrCreateProfile(conversationId: string) {
    const supabase = createSupabaseClient();
    
    // Sử dụng RPC để gọi hàm SQL
    const { data, error } = await supabase.rpc('get_or_create_customer_profile', {
        p_conversation_id: conversationId
    });
    
    if (error) {
        console.error('Error getting profile:', error);
        return null;
    }
    
    // Hàm RPC này trả về profile ID
    // Supabase RPCs trả về data ở dạng mảng 1 phần tử (ví dụ: [ 'profile_id_abc' ]) 
    // hoặc một object. Nếu nó trả về giá trị scalar, hãy trả về phần tử đầu tiên
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
}

/**
 * Extract and save customer info from message
 */
export async function extractAndSaveMemory(
    conversationId: string,
    messageText: string,
    aiResponse: AIResponse // Sử dụng kiểu đã định nghĩa
) {
    const supabase = createSupabaseClient();
    
    // Get profile ID
    // Đảm bảo profileId là string, không phải object hoặc array
    const profileIdData = await getOrCreateProfile(conversationId);
    if (!profileIdData) return;
    
    // Giả định getOrCreateProfile trả về profile_id là string
    const profileId = profileIdData as string; 
    
    // Extract various information
    await Promise.all([
        extractPersonalInfo(supabase, profileId, messageText),
        extractPreferences(supabase, profileId, messageText),
        extractInterests(supabase, profileId, aiResponse.products)
    ]);
    
    // Update engagement
    await supabase.rpc('update_customer_engagement', {
        p_profile_id: profileId
    });
}

/**
 * Extract personal information
 */
async function extractPersonalInfo(supabase: any, profileId: string, text: string) {
    const updates: any = {};
    
    // Extract name
    const nameMatch = text.match(/tên\s+(?:là|tôi là|mình là)\s+([A-Za-zÀ-ỹ\s]+)/i);
    if (nameMatch) {
        updates.full_name = nameMatch[1].trim();
    }
    
    // Extract height (cm or m)
    const heightMatch = text.match(/cao\s+(\d{1,3})\s*(cm|m)?/i);
    if (heightMatch) {
        let height = parseInt(heightMatch[1]);
        if (heightMatch[2]?.toLowerCase().includes('m') && height < 10) {
            height = height * 100;
        }
        if (height >= 100 && height <= 250) {
            updates.height = height;
        }
    }
    
    // Extract weight
    const weightMatch = text.match(/nặng\s+(\d{2,3})\s*kg/i);
    if (weightMatch) {
        const weight = parseInt(weightMatch[1]);
        if (weight >= 30 && weight <= 200) {
            updates.weight = weight;
        }
    }
    
    // Extract size
    const sizeMatch = text.match(/size\s*([SMLX]{1,3})/i);
    if (sizeMatch) {
        updates.usual_size = sizeMatch[1].toUpperCase();
    }
    
    // Extract phone
    const phoneMatch = text.match(/(?:0|\+84)[0-9]{9,10}/);
    if (phoneMatch) {
        updates.phone = phoneMatch[0];
    }
    
    // Update if found anything
    if (Object.keys(updates).length > 0) {
        console.log('Extracted personal info:', updates);
        await supabase
            .from('customer_profiles')
            .update(updates)
            .eq('id', profileId);
    }
}

/**
 * Extract preferences (style, color, price)
 */
async function extractPreferences(supabase: any, profileId: string, text: string) {
    const textLower = text.toLowerCase();
    const updates: any = {};
    
    // Get current profile
    const { data: profile } = await supabase
        .from('customer_profiles')
        .select('style_preference, color_preference, material_preference')
        .eq('id', profileId)
        .single();
    
    if (!profile) return;
    
    // Extract colors
    const colors = [
        'đen', 'trắng', 'be', 'xanh', 'đỏ', 'vàng', 
        'hồng', 'nâu', 'xám', 'navy', 'kem'
    ];
    const mentionedColors = colors.filter(color => textLower.includes(color));
    
    if (mentionedColors.length > 0) {
        const existingColors: string[] = profile.color_preference || [];
        updates.color_preference = [...new Set([...existingColors, ...mentionedColors])];
    }
    
    // Extract style
    const styles = [
        'thanh lịch', 'công sở', 'casual', 'thể thao', 
        'sang trọng', 'trẻ trung', 'cổ điển', 'hiện đại'
    ];
    const mentionedStyles = styles.filter(style => textLower.includes(style));
    
    if (mentionedStyles.length > 0) {
        const existingStyles: string[] = profile.style_preference || [];
        updates.style_preference = [...new Set([...existingStyles, ...mentionedStyles])];
    }
    
    // Extract material preference
    const materials = ['linen', 'cotton', 'silk', 'kaki', 'jean', 'polyester'];
    const mentionedMaterials = materials.filter(mat => textLower.includes(mat));
    
    if (mentionedMaterials.length > 0) {
        const existingMaterials: string[] = profile.material_preference || [];
        updates.material_preference = [...new Set([...existingMaterials, ...mentionedMaterials])];
    }
    
    // Extract price range
    const priceMatches = text.match(/(\d{1,3})[.,]?(\d{3})/g);
    if (priceMatches && priceMatches.length >= 2) {
        const prices = priceMatches.map(p => parseInt(p.replace(/[.,]/g, '')));
        updates.price_range = {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }
    
    // Update if found anything
    if (Object.keys(updates).length > 0) {
        console.log('Extracted preferences:', updates);
        await supabase
            .from('customer_profiles')
            .update(updates)
            .eq('id', profileId);
    }
}

/**
 * Save product interests
 */
async function extractInterests(supabase: any, profileId: string, products: any[]) {
    if (!products || products.length === 0) return;
    
    console.log(`Saving ${products.length} product interests`);
    
    for (const product of products) {
        // Check if interest exists
        const { data: existing } = await supabase
            .from('customer_interests')
            .select('*')
            .eq('customer_profile_id', profileId)
            .eq('product_id', product.id)
            .eq('interest_type', 'viewed')
            .maybeSingle();
        
        if (existing) {
            // Increment view count
            await supabase
                .from('customer_interests')
                .update({
                    view_count: existing.view_count + 1,
                    last_viewed_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            // Create new interest
            await supabase
                .from('customer_interests')
                .insert({
                    customer_profile_id: profileId,
                    product_id: product.id,
                    interest_type: 'viewed',
                    sentiment: 'positive'
                });
        }
    }
}

/**
 * Extract and save memory facts
 */
export async function extractMemoryFacts(
    profileId: string,
    messageText: string,
    conversationId: string
) {
    const supabase = createSupabaseClient();
    const textLower = messageText.toLowerCase();
    const facts: any[] = [];
    
    // Detect negative preferences (không thích)
    const negativeMatch = textLower.match(/không\s+thích\s+([A-Za-zÀ-ỹ\s]+)/i);
    if (negativeMatch) {
        facts.push({
            customer_profile_id: profileId,
            fact_type: 'preference',
            fact_text: `Không thích ${negativeMatch[1].trim()}`,
            importance_score: 7,
            source_conversation_id: conversationId
        });
    }
    
    // Detect positive preferences (thích)
    const positiveMatch = textLower.match(/thích\s+([A-Za-zÀ-ỹ\s]+)/i);
    if (positiveMatch) {
        facts.push({
            customer_profile_id: profileId,
            fact_type: 'preference',
            fact_text: `Thích ${positiveMatch[1].trim()}`,
            importance_score: 7,
            source_conversation_id: conversationId
        });
    }
    
    // Detect budget constraints
    const budgetMatch = textLower.match(/(?:dưới|không quá|tối đa)\s+(\d+k?)/i);
    if (budgetMatch) {
        facts.push({
            customer_profile_id: profileId,
            fact_type: 'constraint',
            fact_text: `Ngân sách ${budgetMatch[0]}`,
            importance_score: 8,
            source_conversation_id: conversationId
        });
    }
    
    // Detect special events
    const eventKeywords = ['đi làm', 'đi chơi', 'dự tiệc', 'du lịch', 'đám cưới'];
    for (const keyword of eventKeywords) {
        if (textLower.includes(keyword)) {
            facts.push({
                customer_profile_id: profileId,
                fact_type: 'life_event',
                fact_text: `Sắp ${keyword}`,
                importance_score: 6,
                source_conversation_id: conversationId,
                // 30 days expiration
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            });
        }
    }
    
    // Save all facts
    if (facts.length > 0) {
        console.log(`Saving ${facts.length} memory facts`);
        await supabase.from('customer_memory_facts').insert(facts);
    }
}

/**
 * Create conversation summary
 */
export async function createConversationSummary(conversationId: string) {
    const supabase = createSupabaseClient();
    
    // Get all messages
    const { data: messages } = await supabase
        .from('chatbot_messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    
    if (!messages || messages.length < 5) return; // Need at least 5 messages
    
    // Sửa lỗi 7006: Thêm định kiểu rõ ràng cho tham số 'm' trong .filter và .map
    const customerMessages = messages
        .filter((m: Message) => m.sender_type === 'customer') // Sửa lỗi 7006
        .map((m: Message) => m.content.text); // Sửa lỗi 7006
    
    const allText = customerMessages.join(' ').toLowerCase();
    
    // Extract key points
    const keyPoints: string[] = [];
    
    if (allText.includes('áo')) keyPoints.push('Quan tâm áo');
    if (allText.includes('quần')) keyPoints.push('Quan tâm quần');
    if (allText.includes('váy')) keyPoints.push('Quan tâm váy');
    if (allText.includes('size')) keyPoints.push('Đã hỏi size');
    if (allText.includes('giá')) keyPoints.push('Hỏi giá');
    if (allText.includes('đặt') || allText.includes('mua')) keyPoints.push('Có ý định mua');
    
    // Determine intent
    let intent = 'browsing';
    if (allText.includes('đặt hàng') || allText.includes('mua')) {
        intent = 'buying';
    } else if (allText.includes('giao hàng') || allText.includes('ship')) {
        intent = 'asking_support';
    }
    
    // Calculate sentiment
    const positiveWords = ['tuyệt', 'đẹp', 'thích', 'ok', 'được', 'hay'];
    const negativeWords = ['không', 'chưa', 'tệ', 'xấu'];
    
    const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
    
    let sentiment = 'neutral';
    let sentimentScore = 0;
    
    if (positiveCount > negativeCount) {
        sentiment = 'positive';
        sentimentScore = 0.5;
    } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        sentimentScore = -0.5;
    }
    
    // Create summary
    const summary = `Khách đã trao đổi ${messages.length} tin nhắn. ${keyPoints.join('. ')}.`;
    
    // Save summary
    await supabase.from('conversation_summaries').insert({
        conversation_id: conversationId,
        summary_text: summary,
        key_points: keyPoints,
        customer_intent: intent,
        sentiment: sentiment,
        sentiment_score: sentimentScore,
        message_count: messages.length,
        customer_messages: customerMessages.length,
        bot_messages: messages.length - customerMessages.length,
        outcome: 'pending'
    });
    
    console.log('✅ Conversation summary created');
}

/**
 * Load customer memory for context
 */
export async function loadCustomerMemory(conversationId: string) {
    const supabase = createSupabaseClient();
    
    // Get profile
    const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();
    
    if (!profile) return null;
    
    // Get interests
    const { data: interests } = await supabase
        .from('customer_interests')
        .select(`
            product_id,
            interest_type,
            view_count,
            last_viewed_at,
            products (id, name, price, slug)
        `)
        .eq('customer_profile_id', profile.id)
        .order('last_viewed_at', { ascending: false })
        .limit(5);
    
    // Get memory facts
    const { data: facts } = await supabase
        .from('customer_memory_facts')
        .select('fact_text, fact_type, importance_score')
        .eq('customer_profile_id', profile.id)
        .eq('is_active', true)
        .order('importance_score', { ascending: false })
        .limit(5);
    
    // Get summary
    const { data: summary } = await supabase
        .from('conversation_summaries')
        .select('summary_text, key_points')
        .eq('conversation_id', conversationId)
        .order('summary_created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    return {
        profile,
        interests: interests || [],
        facts: facts || [],
        summary: summary || null
    };
}