// ============================================
// Embedding Service - Clean Version
// File: supabase/functions/chatbot-process/services/embeddingService.ts
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

/**
 * Create embedding for a chat message
 * Automatically called after saving customer/bot messages
 */
export async function createMessageEmbedding(
  tenantId: string,    
  conversationId: string,
  messageId: string,
  content: string,
  metadata: any = {},
): Promise<void> {
  try {
    const supabase = createSupabaseClient();

    // Validate inputs
    if (!conversationId || !messageId || !content) {
      console.warn("⚠️ Missing required fields for embedding");
      return;
    }

    // Limit content length (prevent huge embeddings)
    const trimmedContent = content.slice(0, 1000);

    // Insert into conversation_embeddings
    const { error } = await supabase
      .from("conversation_embeddings")
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        content: trimmedContent,
        content_type: "message",
        metadata: {
          ...metadata,
          content_length: content.length,
          created_at: new Date().toISOString(),
        },
      });

    if (error) {
      console.error("❌ Error creating embedding:", error);
      // Don't throw - embedding creation shouldn't block main flow
      return;
    }

    console.log(`✅ Created embedding for message ${messageId.slice(0, 8)}...`);
  } catch (error) {
    console.error("❌ createMessageEmbedding failed:", error);
    // Silent fail - don't break the chat flow
  }
}

/**
 * Create embeddings for conversation summary
 * Called when conversation ends or periodically
 */
export async function createSummaryEmbedding(
  tenantId: string, 
  conversationId: string,
  summaryText: string,
  keyPoints: string[] = [],
): Promise<void> {
  try {
    const supabase = createSupabaseClient();

    // Insert summary embedding
    const { error: summaryError } = await supabase
      .from("conversation_embeddings")
      .insert({
        conversation_id: conversationId,
        message_id: null,
        content: summaryText,
        content_type: "summary",
        metadata: {
          key_points_count: keyPoints.length,
          created_at: new Date().toISOString(),
        },
      });

    if (summaryError) {
      console.error("❌ Error creating summary embedding:", summaryError);
    }

    // Insert embeddings for each key point
    if (keyPoints.length > 0) {
      const factEmbeddings = keyPoints.map((point: string) => ({
        conversation_id: conversationId,
        message_id: null,
        content: point,
        content_type: "fact",
        metadata: {
          source: "summary",
          created_at: new Date().toISOString(),
        },
      }));

      await supabase
        .from("conversation_embeddings")
        .insert(factEmbeddings);
    }

    console.log(`✅ Created summary embeddings (${keyPoints.length} facts)`);
  } catch (error) {
    console.error("❌ createSummaryEmbedding failed:", error);
  }
}

/**
 * Search similar messages using embeddings
 * For semantic search in conversation history
 */
export async function searchSimilarMessages(
  conversationId: string,
  query: string,
  limit: number = 5,
): Promise<any[]> {
  try {
    const supabase = createSupabaseClient();

    // For now, use simple text search
    // TODO: Implement vector similarity search when pgvector is enabled
    const { data, error } = await supabase
      .from("conversation_embeddings")
      .select("*")
      .eq("conversation_id", conversationId)
      .textSearch("content", query, {
        type: "websearch",
        config: "english",
      })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error searching embeddings:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ searchSimilarMessages failed:", error);
    return [];
  }
}

/**
 * Get recent context from embeddings
 * Used for building AI context
 */
export async function getRecentContext(
  conversationId: string,
  limit: number = 10,
): Promise<string> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("conversation_embeddings")
      .select("content, content_type, created_at, metadata")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return "";
    }

    // Reverse to get chronological order
    const messages = data.reverse();

    let context = "📋 RECENT CONTEXT FROM EMBEDDINGS:\n";
    messages.forEach((msg: any) => {
      const icon = msg.content_type === "summary"
        ? "📊"
        : msg.content_type === "fact"
        ? "💡"
        : "💬";
      const sender = msg.metadata?.sender_type || "";
      context += `${icon} [${sender}] ${msg.content}\n`;
    });

    return context;
  } catch (error) {
    console.error("❌ getRecentContext failed:", error);
    return "";
  }
}

/**
 * Batch create embeddings for multiple messages
 * Used for migration or bulk operations
 */
export async function batchCreateEmbeddings(
  conversationId: string,
  messages: Array<{ id: string; content: string; metadata?: any }>,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      await createMessageEmbedding(
        conversationId,
        msg.id,
        msg.content,
        msg.metadata,
      );
      success++;
    } catch {
      failed++;
    }
  }

  console.log(`✅ Batch embeddings: ${success} success, ${failed} failed`);
  return { success, failed };
}
