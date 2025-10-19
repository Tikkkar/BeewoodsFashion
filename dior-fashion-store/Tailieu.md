// ============================================
// PHẦN 1: DATABASE SCHEMA
// ============================================

/*
-- 1. Bảng lưu embeddings của conversations
CREATE TABLE conversation_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Nội dung
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  
  -- Metadata để filter
  intent TEXT, -- 'browsing', 'researching', 'interested', 'buying'
  outcome TEXT, -- 'success', 'failed', 'abandoned'
  product_ids UUID[],
  customer_satisfaction INTEGER, -- 1-5 rating
  
  -- Tags để search
  tags TEXT[],
  keywords TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho vector similarity search
CREATE INDEX ON conversation_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index khác
CREATE INDEX idx_conv_emb_intent ON conversation_embeddings(intent);
CREATE INDEX idx_conv_emb_outcome ON conversation_embeddings(outcome);
CREATE INDEX idx_conv_emb_tags ON conversation_embeddings USING gin(tags);

-- 2. Bảng lưu learned patterns (kiến thức tích lũy)
CREATE TABLE learned_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Pattern info
  pattern_type TEXT NOT NULL, -- 'successful_response', 'objection_handling', 'product_recommendation'
  trigger_context TEXT NOT NULL, -- Ngữ cảnh kích hoạt pattern
  response_template TEXT, -- Template câu trả lời hiệu quả
  
  -- Statistics
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN usage_count > 0 
    THEN (success_count::DECIMAL / usage_count * 100)
    ELSE 0 END
  ) STORED,
  
  -- Metadata
  conditions JSONB, -- Điều kiện áp dụng pattern
  examples JSONB[], -- Ví dụ conversations thành công
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learned_pattern_type ON learned_patterns(pattern_type);
CREATE INDEX idx_learned_success_rate ON learned_patterns(success_rate DESC);

-- 3. Bảng feedback để học
CREATE TABLE conversation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id),
  
  -- Feedback
  feedback_type TEXT NOT NULL, -- 'positive', 'negative', 'correction'
  feedback_text TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  -- What was good/bad
  what_worked TEXT,
  what_failed TEXT,
  suggested_improvement TEXT,
  
  -- Source
  feedback_source TEXT, -- 'customer', 'admin', 'system'
  admin_id UUID REFERENCES admin_users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng knowledge base từ học tập
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding vector(1536),
  
  -- Context
  category TEXT, -- 'product_info', 'policy', 'handling_objection', 'small_talk'
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  
  -- Learning source
  source_type TEXT, -- 'conversation', 'manual', 'feedback'
  source_ids UUID[],
  verified_by_admin BOOLEAN DEFAULT false,
  
  -- Usage stats
  times_used INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
*/

// ============================================
// PHẦN 2: EMBEDDING SERVICE
// ============================================

import { createSupabaseClient } from './supabaseClient.ts';

interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export class EmbeddingService {
  private openaiApiKey: string;

  constructor(apiKey: string) {
    this.openaiApiKey = apiKey;
  }

  /**
   * Tạo embedding từ text sử dụng OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Tạo embeddings cho nhiều texts
   */
  async createBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-ada-002'
      })
    });

    const data = await response.json();
    return texts.map((text, idx) => ({
      text,
      embedding: data.data[idx].embedding
    }));
  }
}

// ============================================
// PHẦN 3: CONVERSATION LEARNING SERVICE
// ============================================

interface ConversationContext {
  conversation_id: string;
  customer_id: string;
  messages: Array<{
    id: string;
    sender_type: 'customer' | 'bot';
    content: any;
    created_at: string;
  }>;
  outcome?: 'success' | 'failed' | 'abandoned';
  products_discussed: string[];
}

interface LearnedInsight {
  pattern_type: string;
  trigger_context: string;
  response_template?: string;
  examples: any[];
  confidence: number;
}

export class ConversationLearningService {
  private supabase;
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.supabase = createSupabaseClient();
    this.embeddingService = embeddingService;
  }

  /**
   * Phân tích và lưu embeddings cho một cuộc hội thoại
   */
  async analyzeAndStoreConversation(context: ConversationContext): Promise<void> {
    try {
      // 1. Tạo conversation summary
      const summary = this.createConversationSummary(context);
      
      // 2. Tạo embedding cho summary
      const embedding = await this.embeddingService.createEmbedding(summary);
      
      // 3. Phân tích intent và outcome
      const intent = this.detectIntent(context);
      const outcome = context.outcome || this.inferOutcome(context);
      
      // 4. Extract keywords và tags
      const { keywords, tags } = this.extractKeywordsAndTags(context);
      
      // 5. Lưu vào database
      await this.supabase
        .from('conversation_embeddings')
        .insert({
          conversation_id: context.conversation_id,
          content: summary,
          embedding: JSON.stringify(embedding),
          intent,
          outcome,
          product_ids: context.products_discussed,
          tags,
          keywords
        });

      // 6. Nếu conversation thành công → học pattern
      if (outcome === 'success') {
        await this.learnFromSuccessfulConversation(context);
      }

    } catch (error) {
      console.error('Error analyzing conversation:', error);
    }
  }

  /**
   * Tạo summary ngắn gọn của conversation
   */
  private createConversationSummary(context: ConversationContext): string {
    const messages = context.messages;
    const customerMessages = messages
      .filter(m => m.sender_type === 'customer')
      .map(m => m.content?.text || '')
      .join(' | ');
    
    const botMessages = messages
      .filter(m => m.sender_type === 'bot')
      .map(m => m.content?.text || '')
      .join(' | ');

    return `Customer: ${customerMessages}\nBot: ${botMessages}`;
  }

  /**
   * Phát hiện intent chính của conversation
   */
  private detectIntent(context: ConversationContext): string {
    const messages = context.messages.map(m => m.content?.text?.toLowerCase() || '');
    const allText = messages.join(' ');

    // Simple rule-based detection (có thể cải thiện bằng ML)
    if (/đặt hàng|mua|chốt đơn|giao hàng/.test(allText)) return 'buying';
    if (/đẹp|ưng|thích|quan tâm/.test(allText)) return 'interested';
    if (/giá|màu|size|chất liệu/.test(allText)) return 'researching';
    return 'browsing';
  }

  /**
   * Suy luận outcome từ conversation
   */
  private inferOutcome(context: ConversationContext): string {
    const lastMessages = context.messages.slice(-3);
    const hasOrder = lastMessages.some(m => 
      m.sender_type === 'bot' && 
      m.content?.text?.includes('ghi nhận đơn hàng')
    );

    if (hasOrder) return 'success';
    
    const hasGoodbye = lastMessages.some(m =>
      m.content?.text?.toLowerCase().includes('cảm ơn')
    );
    
    if (hasGoodbye) return 'success';
    
    return 'abandoned';
  }

  /**
   * Extract keywords và tags
   */
  private extractKeywordsAndTags(context: ConversationContext): {
    keywords: string[];
    tags: string[];
  } {
    const allText = context.messages
      .map(m => m.content?.text || '')
      .join(' ')
      .toLowerCase();

    // Extract product keywords
    const productKeywords = [
      'vest', 'áo', 'quần', 'váy', 'đầm', 'sơ mi', 
      'linen', 'cotton', 'size', 'màu'
    ].filter(kw => allText.includes(kw));

    // Extract intent tags
    const tags: string[] = [];
    if (allText.includes('đi làm')) tags.push('công sở');
    if (allText.includes('dự tiệc')) tags.push('sự kiện');
    if (allText.includes('thanh lịch')) tags.push('thanh lịch');
    if (allText.includes('giá')) tags.push('quan tâm giá');

    return {
      keywords: [...new Set(productKeywords)],
      tags: [...new Set(tags)]
    };
  }

  /**
   * Học pattern từ conversation thành công
   */
  private async learnFromSuccessfulConversation(context: ConversationContext): Promise<void> {
    // Tìm các response hiệu quả của bot
    const botMessages = context.messages.filter(m => m.sender_type === 'bot');
    
    for (const msg of botMessages) {
      const responseText = msg.content?.text || '';
      
      // Phát hiện pattern type
      let patternType = 'general_response';
      if (responseText.includes('gợi ý')) patternType = 'product_recommendation';
      if (responseText.includes('Dạ')) patternType = 'polite_response';
      if (responseText.includes('địa chỉ')) patternType = 'checkout_flow';

      // Check xem pattern đã tồn tại chưa
      const { data: existing } = await this.supabase
        .from('learned_patterns')
        .select('id, usage_count, success_count')
        .eq('pattern_type', patternType)
        .eq('trigger_context', this.getTriggerContext(context, msg))
        .single();

      if (existing) {
        // Update existing pattern
        await this.supabase
          .from('learned_patterns')
          .update({
            usage_count: existing.usage_count + 1,
            success_count: existing.success_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new pattern
        await this.supabase
          .from('learned_patterns')
          .insert({
            pattern_type: patternType,
            trigger_context: this.getTriggerContext(context, msg),
            response_template: responseText,
            usage_count: 1,
            success_count: 1,
            examples: [{ conversation_id: context.conversation_id }]
          });
      }
    }
  }

  /**
   * Lấy trigger context cho một message
   */
  private getTriggerContext(context: ConversationContext, message: any): string {
    const msgIndex = context.messages.findIndex(m => m.id === message.id);
    if (msgIndex > 0) {
      const previousMsg = context.messages[msgIndex - 1];
      return previousMsg.content?.text?.substring(0, 100) || '';
    }
    return 'conversation_start';
  }

  /**
   * Tìm kiếm conversations tương tự bằng vector search
   */
  async findSimilarConversations(
    query: string,
    limit: number = 5,
    filters?: {
      intent?: string;
      outcome?: string;
      minSatisfaction?: number;
    }
  ): Promise<any[]> {
    // 1. Tạo embedding cho query
    const queryEmbedding = await this.embeddingService.createEmbedding(query);

    // 2. Vector similarity search
    let sqlQuery = this.supabase
      .from('conversation_embeddings')
      .select('*, embedding <=> $1 as similarity')
      .order('similarity')
      .limit(limit);

    // Apply filters
    if (filters?.intent) {
      sqlQuery = sqlQuery.eq('intent', filters.intent);
    }
    if (filters?.outcome) {
      sqlQuery = sqlQuery.eq('outcome', filters.outcome);
    }
    if (filters?.minSatisfaction) {
      sqlQuery = sqlQuery.gte('customer_satisfaction', filters.minSatisfaction);
    }

    const { data, error } = await sqlQuery;

    if (error) {
      console.error('Error finding similar conversations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Lấy learned patterns phù hợp với context hiện tại
   */
  async getRelevantPatterns(
    currentContext: string,
    patternType?: string
  ): Promise<any[]> {
    let query = this.supabase
      .from('learned_patterns')
      .select('*')
      .eq('is_active', true)
      .gte('success_rate', 60) // Chỉ lấy patterns có success rate >= 60%
      .order('success_rate', { ascending: false })
      .limit(5);

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    const { data } = await query;
    return data || [];
  }
}

// ============================================
// PHẦN 4: KNOWLEDGE BASE SERVICE
// ============================================

export class KnowledgeBaseService {
  private supabase;
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.supabase = createSupabaseClient();
    this.embeddingService = embeddingService;
  }

  /**
   * Thêm kiến thức mới vào knowledge base
   */
  async addKnowledge(
    question: string,
    answer: string,
    category: string,
    source: {
      type: string;
      ids: string[];
    },
    verifiedByAdmin: boolean = false
  ): Promise<void> {
    // Tạo embedding
    const embedding = await this.embeddingService.createEmbedding(
      `${question} ${answer}`
    );

    await this.supabase
      .from('knowledge_base')
      .insert({
        question,
        answer,
        embedding: JSON.stringify(embedding),
        category,
        source_type: source.type,
        source_ids: source.ids,
        verified_by_admin: verifiedByAdmin
      });
  }

  /**
   * Tìm kiếm kiến thức liên quan
   */
  async searchKnowledge(
    query: string,
    options: {
      category?: string;
      onlyVerified?: boolean;
      limit?: number;
    } = {}
  ): Promise<Array<{
    question: string;
    answer: string;
    confidence: number;
    similarity: number;
  }>> {
    const { category, onlyVerified = false, limit = 3 } = options;

    // Tạo embedding cho query
    const queryEmbedding = await this.embeddingService.createEmbedding(query);

    // Vector search
    let sqlQuery = this.supabase
      .from('knowledge_base')
      .select('question, answer, confidence_score, embedding <=> $1 as similarity')
      .order('similarity')
      .limit(limit);

    if (category) {
      sqlQuery = sqlQuery.eq('category', category);
    }

    if (onlyVerified) {
      sqlQuery = sqlQuery.eq('verified_by_admin', true);
    }

    const { data } = await sqlQuery;

    return (data || []).map(item => ({
      question: item.question,
      answer: item.answer,
      confidence: item.confidence_score,
      similarity: 1 - item.similarity // Convert distance to similarity
    }));
  }

  /**
   * Update usage statistics khi knowledge được sử dụng
   */
  async recordUsage(knowledgeId: string, wasHelpful: boolean): Promise<void> {
    const { data } = await this.supabase
      .from('knowledge_base')
      .select('times_used, helpful_count')
      .eq('id', knowledgeId)
      .single();

    if (data) {
      await this.supabase
        .from('knowledge_base')
        .update({
          times_used: data.times_used + 1,
          helpful_count: wasHelpful ? data.helpful_count + 1 : data.helpful_count
        })
        .eq('id', knowledgeId);
    }
  }
}

// ============================================
// PHẦN 5: FEEDBACK SERVICE
// ============================================

export class FeedbackService {
  private supabase;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  /**
   * Thu thập feedback từ conversation
   */
  async collectFeedback(feedback: {
    conversation_id: string;
    message_id?: string;
    feedback_type: 'positive' | 'negative' | 'correction';
    rating?: number;
    feedback_text?: string;
    what_worked?: string;
    what_failed?: string;
    suggested_improvement?: string;
    source: 'customer' | 'admin' | 'system';
    admin_id?: string;
  }): Promise<void> {
    await this.supabase
      .from('conversation_feedback')
      .insert(feedback);
  }

  /**
   * Phân tích feedback để cải thiện
   */
  async analyzeFeedbackPatterns(): Promise<{
    common_issues: string[];
    improvement_suggestions: string[];
    success_patterns: string[];
  }> {
    // Lấy negative feedback
    const { data: negativeFeedback } = await this.supabase
      .from('conversation_feedback')
      .select('what_failed, suggested_improvement')
      .eq('feedback_type', 'negative')
      .order('created_at', { ascending: false })
      .limit(50);

    // Lấy positive feedback
    const { data: positiveFeedback } = await this.supabase
      .from('conversation_feedback')
      .select('what_worked')
      .eq('feedback_type', 'positive')
      .order('created_at', { ascending: false })
      .limit(50);

    // Phân tích patterns (có thể dùng NLP để cluster)
    const common_issues = this.extractCommonPatterns(
      negativeFeedback?.map(f => f.what_failed || '') || []
    );

    const improvement_suggestions = this.extractCommonPatterns(
      negativeFeedback?.map(f => f.suggested_improvement || '') || []
    );

    const success_patterns = this.extractCommonPatterns(
      positiveFeedback?.map(f => f.what_worked || '') || []
    );

    return {
      common_issues,
      improvement_suggestions,
      success_patterns
    };
  }

  private extractCommonPatterns(texts: string[]): string[] {
    // Simple frequency analysis (có thể cải thiện bằng NLP)
    const wordFreq: { [key: string]: number } = {};
    
    texts.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

// ============================================
// PHẦN 6: ENHANCED PROMPT WITH LEARNING
// ============================================

export async function buildEnhancedPromptWithLearning(
  context: any,
  userMessage: string,
  services: {
    learningService: ConversationLearningService;
    knowledgeService: KnowledgeBaseService;
  }
): Promise<string> {
  const basePrompt = await getSystemPrompt(); // From previous prompts.ts

  // 1. Tìm similar successful conversations
  const similarConvs = await services.learningService.findSimilarConversations(
    userMessage,
    3,
    { outcome: 'success' }
  );

  // 2. Tìm relevant learned patterns
  const relevantPatterns = await services.learningService.getRelevantPatterns(
    userMessage
  );

  // 3. Search knowledge base
  const relevantKnowledge = await services.knowledgeService.searchKnowledge(
    userMessage,
    { limit: 3, onlyVerified: true }
  );

  // 4. Build enhanced context
  let enhancedContext = '\n===== LEARNED INSIGHTS =====\n';

  if (similarConvs.length > 0) {
    enhancedContext += '\n📚 CONVERSATIONS THÀNH CÔNG TƯƠNG TỰ:\n';
    similarConvs.forEach((conv, idx) => {
      enhancedContext += `${idx + 1}. [Similarity: ${(1 - conv.similarity).toFixed(2)}]\n`;
      enhancedContext += `   ${conv.content.substring(0, 200)}...\n`;
    });
  }

  if (relevantPatterns.length > 0) {
    enhancedContext += '\n🎯 PATTERNS HIỆU QUẢ:\n';
    relevantPatterns.forEach((pattern, idx) => {
      enhancedContext += `${idx + 1}. ${pattern.pattern_type} (Success rate: ${pattern.success_rate}%)\n`;
      enhancedContext += `   Trigger: ${pattern.trigger_context}\n`;
      if (pattern.response_template) {
        enhancedContext += `   Template: ${pattern.response_template.substring(0, 150)}...\n`;
      }
    });
  }

  if (relevantKnowledge.length > 0) {
    enhancedContext += '\n💡 KIẾN THỨC LIÊN QUAN:\n';
    relevantKnowledge.forEach((kb, idx) => {
      enhancedContext += `${idx + 1}. Q: ${kb.question}\n`;
      enhancedContext += `   A: ${kb.answer}\n`;
      enhancedContext += `   (Confidence: ${kb.confidence}, Similarity: ${kb.similarity.toFixed(2)})\n`;
    });
  }

  return `${basePrompt}

${enhancedContext}

⚠️ SỬ DỤNG LEARNED INSIGHTS:
- Tham khảo các conversations thành công để biết cách xử lý tương tự
- Áp dụng patterns đã được chứng minh hiệu quả
- Sử dụng kiến thức đã học để trả lời chính xác hơn
- VẪN GIỮ PHONG CÁCH TỰ NHIÊN, không copy y nguyên

${context}

👤 TIN NHẮN CỦA KHÁCH: "${userMessage}"

CHỈ TRẢ JSON!`;
}

// ============================================
// PHẦN 7: AUTO-LEARNING WORKFLOW
// ============================================

export class AutoLearningWorkflow {
  private learningService: ConversationLearningService;
  private knowledgeService: KnowledgeBaseService;
  private feedbackService: FeedbackService;

  constructor(
    learningService: ConversationLearningService,
    knowledgeService: KnowledgeBaseService,
    feedbackService: FeedbackService
  ) {
    this.learningService = learningService;
    this.knowledgeService = knowledgeService;
    this.feedbackService = feedbackService;
  }

  /**
   * Chạy tự động sau mỗi conversation kết thúc
   */
  async processCompletedConversation(conversationId: string): Promise<void> {
    try {
      // 1. Fetch full conversation
      const supabase = createSupabaseClient();
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          id,
          customer_id,
          messages (
            id,
            sender_type,
            content,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      // 2. Analyze and store embeddings
      const context: ConversationContext = {
        conversation_id: conversationId,
        customer_id: conversation.customer_id,
        messages: conversation.messages,
        products_discussed: [] // Extract from messages
      };

      await this.learningService.analyzeAndStoreConversation(context);

      // 3. Extract Q&A pairs for knowledge base
      await this.extractAndStoreKnowledge(conversation.messages, conversationId);

      console.log(`✅ Learned from conversation ${conversationId}`);
    } catch (error) {
      console.error('Error in auto-learning workflow:', error);
    }
  }

  /**
   * Extract Q&A pairs từ conversation
   */
  private async extractAndStoreKnowledge(
    messages: any[],
    conversationId: string
  ): Promise<void> {
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      const nextMsg = messages[i + 1];

      // Nếu khách hỏi và bot trả lời
      if (msg.sender_type === 'customer' && nextMsg.sender_type === 'bot') {
        const question = msg.content?.text;
        const answer = nextMsg.content?.text;

        if (question && answer && question.includes('?')) {
          // Detect category
          let category = 'general';
          if (question.includes('giá')) category = 'product_info';
          if (question.includes('giao hàng')) category = 'policy';

          await this.knowledgeService.addKnowledge(
            question,
            answer,
            category,
            {
              type: 'conversation',
              ids: [conversationId]
            },
            false // Chưa verify
          );
        }
      }
    }
  }

  /**
   * Periodic learning job - chạy hàng ngày
   */
  async runDailyLearningJob(): Promise<void> {
    console.log('🔄 Running daily learning job...');

    // 1. Analyze feedback patterns
    const feedbackAnalysis = await this.feedbackService.analyzeFeedbackPatterns();
    console.log('📊 Feedback analysis:', feedbackAnalysis);

    // 2. Update pattern confidence scores
    // TODO: Implement based on recent performance

    // 3. Consolidate knowledge base
    // TODO: Merge similar Q&As, remove low-quality entries

    console.log('✅ Daily learning job completed');
  }
}

// ============================================
// PHẦN 8: USAGE EXAMPLE
// ============================================

/*
// Initialize services
const embeddingService = new EmbeddingService(OPENAI_API_KEY);
const learningService = new ConversationLearningService(embeddingService);
const knowledgeService = new KnowledgeBaseService(embeddingService);
const feedbackService = new FeedbackService();

const autoLearning = new AutoLearningWorkflow(
  learningService,
  knowledgeService,
  feedbackService
);

// 1. Trong chat endpoint - sử dụng learned insights
const enhancedPrompt = await buildEnhancedPromptWithLearning(
  context,
  userMessage,
  { learningService, knowledgeService }
);

// 2. Sau khi conversation kết thúc
await autoLearning.processCompletedConversation(conversationId);

// 3. Thu thập feedback
await feedbackService.collectFeedback({
  conversation_id: conversationId,
  feedback_type: 'positive',
  rating: 5,
  what_worked: 'Bot tư vấn rất chi tiết và kiên nhẫn',
  source: 'customer'
});

// 4. Chạy daily learning job (cron job)
// Schedule: every day at 2 AM
await autoLearning.runDailyLearningJob();
*/

// ============================================
// PHẦN 9: REAL-TIME LEARNING DURING CONVERSATION
// ============================================

export class RealtimeLearningAgent {
  private learningService: ConversationLearningService;
  private knowledgeService: KnowledgeBaseService;
  private conversationMemory: Map<string, any[]> = new Map();

  constructor(
    learningService: ConversationLearningService,
    knowledgeService: KnowledgeBaseService
  ) {
    this.learningService = learningService;
    this.knowledgeService = knowledgeService;
  }

  /**
   * Học trong lúc conversation đang diễn ra
   */
  async learnFromInteraction(
    conversationId: string,
    userMessage: string,
    botResponse: string,
    userReaction?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    // 1. Store in memory
    if (!this.conversationMemory.has(conversationId)) {
      this.conversationMemory.set(conversationId, []);
    }

    const memory = this.conversationMemory.get(conversationId)!;
    memory.push({
      user: userMessage,
      bot: botResponse,
      reaction: userReaction,
      timestamp: new Date()
    });

    // 2. Immediate learning signals
    if (userReaction === 'positive') {
      // User liked the response → reinforce this pattern
      await this.reinforcePattern(userMessage, botResponse);
    } else if (userReaction === 'negative') {
      // User didn't like → mark for review
      await this.flagForReview(conversationId, userMessage, botResponse);
    }

    // 3. Detect if bot should adjust strategy
    const shouldAdjust = this.detectStrategyAdjustmentNeeded(memory);
    if (shouldAdjust) {
      // TODO: Send signal to adjust conversation strategy
      console.log('⚠️ Strategy adjustment recommended for', conversationId);
    }
  }

  /**
   * Reinforce successful pattern
   */
  private async reinforcePattern(trigger: string, response: string): Promise<void> {
    const supabase = createSupabaseClient();
    
    // Find matching pattern
    const { data: pattern } = await supabase
      .from('learned_patterns')
      .select('id, success_count, usage_count')
      .ilike('trigger_context', `%${trigger.substring(0, 50)}%`)
      .single();

    if (pattern) {
      // Increase success count
      await supabase
        .from('learned_patterns')
        .update({
          success_count: pattern.success_count + 1,
          usage_count: pattern.usage_count + 1
        })
        .eq('id', pattern.id);
    }
  }

  /**
   * Flag response for admin review
   */
  private async flagForReview(
    conversationId: string,
    userMessage: string,
    botResponse: string
  ): Promise<void> {
    const supabase = createSupabaseClient();
    
    await supabase
      .from('conversation_feedback')
      .insert({
        conversation_id: conversationId,
        feedback_type: 'negative',
        feedback_text: `User message: ${userMessage}\nBot response: ${botResponse}`,
        what_failed: 'User showed negative reaction',
        feedback_source: 'system'
      });
  }

  /**
   * Detect if strategy adjustment needed
   */
  private detectStrategyAdjustmentNeeded(memory: any[]): boolean {
    if (memory.length < 3) return false;

    // Check last 3 interactions
    const recent = memory.slice(-3);
    const negativeCount = recent.filter(m => m.reaction === 'negative').length;

    // If 2+ negative reactions → need adjustment
    return negativeCount >= 2;
  }

  /**
   * Get conversation insights in real-time
   */
  async getConversationInsights(conversationId: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    engagement_level: 'high' | 'medium' | 'low';
    predicted_outcome: 'likely_purchase' | 'researching' | 'likely_abandon';
    suggestions: string[];
  }> {
    const memory = this.conversationMemory.get(conversationId) || [];
    
    // Analyze sentiment
    const reactions = memory.map(m => m.reaction).filter(Boolean);
    const positiveRatio = reactions.filter(r => r === 'positive').length / reactions.length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveRatio > 0.6) sentiment = 'positive';
    else if (positiveRatio < 0.3) sentiment = 'negative';

    // Analyze engagement
    const messageCount = memory.length;
    const engagement_level = 
      messageCount > 10 ? 'high' :
      messageCount > 5 ? 'medium' : 'low';

    // Predict outcome based on patterns
    const lastMessages = memory.slice(-3).map(m => m.user.toLowerCase());
    const hasBuyingSignals = lastMessages.some(msg => 
      /đặt|mua|lấy|chốt|giao/.test(msg)
    );
    const hasResearchSignals = lastMessages.some(msg =>
      /giá|màu|size|so sánh/.test(msg)
    );

    let predicted_outcome: 'likely_purchase' | 'researching' | 'likely_abandon' = 'researching';
    if (hasBuyingSignals && sentiment === 'positive') {
      predicted_outcome = 'likely_purchase';
    } else if (sentiment === 'negative' || messageCount < 2) {
      predicted_outcome = 'likely_abandon';
    }

    // Generate suggestions
    const suggestions: string[] = [];
    if (predicted_outcome === 'likely_abandon' && sentiment === 'negative') {
      suggestions.push('Cân nhắc offer giảm giá hoặc freeship');
      suggestions.push('Hỏi xem có vấn đề gì cần hỗ trợ');
    }
    if (predicted_outcome === 'likely_purchase') {
      suggestions.push('Chủ động đề nghị hỗ trợ đặt hàng');
      suggestions.push('Nhắc về chính sách đổi trả để tăng confidence');
    }
    if (engagement_level === 'low') {
      suggestions.push('Tạo tương tác bằng câu hỏi mở');
      suggestions.push('Gợi ý sản phẩm phù hợp nhu cầu');
    }

    return {
      sentiment,
      engagement_level,
      predicted_outcome,
      suggestions
    };
  }
}

// ============================================
// PHẦN 10: CONTINUOUS IMPROVEMENT ENGINE
// ============================================

export class ContinuousImprovementEngine {
  private supabase;
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.supabase = createSupabaseClient();
    this.embeddingService = embeddingService;
  }

  /**
   * A/B testing cho responses
   */
  async runABTest(
    scenario: string,
    responseA: string,
    responseB: string,
    duration_days: number = 7
  ): Promise<string> {
    // Create test record
    const { data: test } = await this.supabase
      .from('ab_tests')
      .insert({
        scenario,
        response_a: responseA,
        response_b: responseB,
        start_date: new Date(),
        end_date: new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000),
        status: 'active'
      })
      .select()
      .single();

    return test.id;
  }

  /**
   * Evaluate A/B test results
   */
  async evaluateABTest(testId: string): Promise<{
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    metrics: {
      response_a: { usage: number; success_rate: number };
      response_b: { usage: number; success_rate: number };
    };
  }> {
    // Fetch test results
    const { data: test } = await this.supabase
      .from('ab_tests')
      .select('*, ab_test_results(*)')
      .eq('id', testId)
      .single();

    if (!test) {
      throw new Error('Test not found');
    }

    // Calculate metrics
    const resultsA = test.ab_test_results.filter((r: any) => r.variant === 'A');
    const resultsB = test.ab_test_results.filter((r: any) => r.variant === 'B');

    const metricsA = this.calculateMetrics(resultsA);
    const metricsB = this.calculateMetrics(resultsB);

    // Determine winner (using statistical significance)
    let winner: 'A' | 'B' | 'tie' = 'tie';
    let confidence = 0;

    if (metricsA.success_rate > metricsB.success_rate + 0.05) {
      winner = 'A';
      confidence = this.calculateConfidence(metricsA, metricsB);
    } else if (metricsB.success_rate > metricsA.success_rate + 0.05) {
      winner = 'B';
      confidence = this.calculateConfidence(metricsB, metricsA);
    }

    return {
      winner,
      confidence,
      metrics: {
        response_a: metricsA,
        response_b: metricsB
      }
    };
  }

  private calculateMetrics(results: any[]): {
    usage: number;
    success_rate: number;
  } {
    const usage = results.length;
    const successes = results.filter((r: any) => r.outcome === 'success').length;
    const success_rate = usage > 0 ? successes / usage : 0;

    return { usage, success_rate };
  }

  private calculateConfidence(winner: any, loser: any): number {
    // Simple confidence calculation (can be improved with proper statistical tests)
    const diff = Math.abs(winner.success_rate - loser.success_rate);
    const sampleSize = Math.min(winner.usage, loser.usage);
    
    // More samples + bigger difference = higher confidence
    const confidence = Math.min(diff * Math.log(sampleSize + 1) * 100, 99);
    return Math.round(confidence);
  }

  /**
   * Auto-optimize prompts based on performance
   */
  async optimizePrompts(): Promise<{
    changes: Array<{
      section: string;
      old_version: string;
      new_version: string;
      reason: string;
    }>;
  }> {
    const changes: any[] = [];

    // 1. Find underperforming patterns
    const { data: poorPatterns } = await this.supabase
      .from('learned_patterns')
      .select('*')
      .lt('success_rate', 50)
      .gte('usage_count', 10);

    // 2. Find high-performing alternatives
    for (const pattern of poorPatterns || []) {
      const alternatives = await this.findBetterAlternatives(
        pattern.pattern_type,
        pattern.trigger_context
      );

      if (alternatives.length > 0) {
        const best = alternatives[0];
        
        changes.push({
          section: pattern.pattern_type,
          old_version: pattern.response_template,
          new_version: best.response_template,
          reason: `Low success rate (${pattern.success_rate}%) vs better alternative (${best.success_rate}%)`
        });

        // Update the pattern
        await this.supabase
          .from('learned_patterns')
          .update({
            response_template: best.response_template,
            updated_at: new Date().toISOString()
          })
          .eq('id', pattern.id);
      }
    }

    return { changes };
  }

  private async findBetterAlternatives(
    patternType: string,
    triggerContext: string
  ): Promise<any[]> {
    // Find similar patterns with better performance
    const { data } = await this.supabase
      .from('learned_patterns')
      .select('*')
      .eq('pattern_type', patternType)
      .gt('success_rate', 70)
      .gte('usage_count', 5)
      .order('success_rate', { ascending: false })
      .limit(3);

    return data || [];
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
    total_conversations: number;
    success_rate: number;
    avg_conversation_length: number;
    common_intents: Array<{ intent: string; count: number }>;
    top_performing_patterns: any[];
    areas_for_improvement: string[];
    knowledge_base_stats: {
      total_entries: number;
      verified_entries: number;
      avg_confidence: number;
    };
  }> {
    const daysAgo = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // 1. Conversation stats
    const { data: conversations, count: total_conversations } = await this.supabase
      .from('conversation_embeddings')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    const successCount = conversations?.filter(c => c.outcome === 'success').length || 0;
    const success_rate = total_conversations ? (successCount / total_conversations) * 100 : 0;

    // 2. Intent distribution
    const intentCounts: { [key: string]: number } = {};
    conversations?.forEach(c => {
      intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1;
    });

    const common_intents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Top performing patterns
    const { data: topPatterns } = await this.supabase
      .from('learned_patterns')
      .select('*')
      .gte('updated_at', startDate.toISOString())
      .order('success_rate', { ascending: false })
      .limit(5);

    // 4. Areas for improvement
    const areas_for_improvement: string[] = [];
    
    if (success_rate < 60) {
      areas_for_improvement.push('Overall success rate below target (60%)');
    }

    const abandonedCount = conversations?.filter(c => c.outcome === 'abandoned').length || 0;
    if (abandonedCount > total_conversations! * 0.3) {
      areas_for_improvement.push('High abandonment rate (>30%)');
    }

    // 5. Knowledge base stats
    const { data: kbStats } = await this.supabase
      .from('knowledge_base')
      .select('confidence_score, verified_by_admin');

    const knowledge_base_stats = {
      total_entries: kbStats?.length || 0,
      verified_entries: kbStats?.filter(k => k.verified_by_admin).length || 0,
      avg_confidence: kbStats?.reduce((sum, k) => sum + k.confidence_score, 0) / (kbStats?.length || 1)
    };

    return {
      total_conversations: total_conversations || 0,
      success_rate: Math.round(success_rate),
      avg_conversation_length: 0, // TODO: Calculate from messages
      common_intents,
      top_performing_patterns: topPatterns || [],
      areas_for_improvement,
      knowledge_base_stats
    };
  }
}

// ============================================
// PHẦN 11: ADMIN DASHBOARD HELPERS
// ============================================

export class AdminLearningDashboard {
  private supabase;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  /**
   * Get conversations that need review
   */
  async getConversationsForReview(limit: number = 20): Promise<any[]> {
    // Conversations with negative feedback or low satisfaction
    const { data } = await this.supabase
      .from('conversation_embeddings')
      .select(`
        *,
        conversation:conversations(*)
      `)
      .or('outcome.eq.failed,customer_satisfaction.lte.2')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Approve or reject learned knowledge
   */
  async reviewKnowledge(
    knowledgeId: string,
    action: 'approve' | 'reject' | 'edit',
    adminId: string,
    editedAnswer?: string
  ): Promise<void> {
    if (action === 'approve') {
      await this.supabase
        .from('knowledge_base')
        .update({
          verified_by_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', knowledgeId);
    } else if (action === 'reject') {
      await this.supabase
        .from('knowledge_base')
        .delete()
        .eq('id', knowledgeId);
    } else if (action === 'edit' && editedAnswer) {
      // Re-create embedding for edited answer
      const embeddingService = new EmbeddingService(process.env.OPENAI_API_KEY!);
      const { data: kb } = await this.supabase
        .from('knowledge_base')
        .select('question')
        .eq('id', knowledgeId)
        .single();

      const newEmbedding = await embeddingService.createEmbedding(
        `${kb.question} ${editedAnswer}`
      );

      await this.supabase
        .from('knowledge_base')
        .update({
          answer: editedAnswer,
          embedding: JSON.stringify(newEmbedding),
          verified_by_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', knowledgeId);
    }
  }

  /**
   * Get learning analytics
   */
  async getLearningAnalytics(period: number = 7): Promise<{
    new_patterns_learned: number;
    knowledge_base_growth: number;
    improvement_in_success_rate: number;
    top_learned_insights: any[];
  }> {
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // New patterns
    const { count: new_patterns_learned } = await this.supabase
      .from('learned_patterns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Knowledge base growth
    const { count: knowledge_base_growth } = await this.supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Success rate improvement (compare to previous period)
    // TODO: Implement proper comparison logic

    // Top insights
    const { data: top_learned_insights } = await this.supabase
      .from('learned_patterns')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('success_rate', { ascending: false })
      .limit(10);

    return {
      new_patterns_learned: new_patterns_learned || 0,
      knowledge_base_growth: knowledge_base_growth || 0,
      improvement_in_success_rate: 0, // TODO
      top_learned_insights: top_learned_insights || []
    };
  }
}

// ============================================
// PHẦN 12: INTEGRATION WITH MAIN CHAT API
// ============================================

export async function handleChatWithLearning(
  conversationId: string,
  userMessage: string,
  context: any
): Promise<{
  response: string;
  learned_insights_used: number;
  confidence_score: number;
}> {
  // Initialize services
  const embeddingService = new EmbeddingService(process.env.OPENAI_API_KEY!);
  const learningService = new ConversationLearningService(embeddingService);
  const knowledgeService = new KnowledgeBaseService(embeddingService);
  const realtimeAgent = new RealtimeLearningAgent(learningService, knowledgeService);

  // 1. Build enhanced prompt with learning
  const enhancedPrompt = await buildEnhancedPromptWithLearning(
    context,
    userMessage,
    { learningService, knowledgeService }
  );

  // 2. Get conversation insights
  const insights = await realtimeAgent.getConversationInsights(conversationId);
  
  // 3. Call LLM with enhanced prompt
  // ... (your existing LLM call)
  const botResponse = "..."; // From LLM

  // 4. Learn from this interaction
  await realtimeAgent.learnFromInteraction(
    conversationId,
    userMessage,
    botResponse
  );

  // 5. Return response với metadata
  return {
    response: botResponse,
    learned_insights_used: 3, // Count from enhanced prompt
    confidence_score: insights.predicted_outcome === 'likely_purchase' ? 0.9 : 0.6
  };
}

// ============================================
// EXPORT ALL
// ============================================

export {
  EmbeddingService,
  ConversationLearningService,
  KnowledgeBaseService,
  FeedbackService,
  AutoLearningWorkflow,
  RealtimeLearningAgent,
  ContinuousImprovementEngine,
  AdminLearningDashboard
};