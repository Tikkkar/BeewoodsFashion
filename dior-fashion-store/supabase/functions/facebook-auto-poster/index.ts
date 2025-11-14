// supabase/functions/facebook-auto-poster/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { generateFacebookPost } from "./facebookPostGeneratorService.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log(`[Facebook Auto-Poster] Action: ${action}`);

    switch (action) {
      case "PROCESS_PENDING_POSTS":
        return await processPendingPosts(payload?.tenant_id);

      case "POST_NOW":
        return await postNow(payload.post_id);

      case "POST_PRODUCT_NOW":
        return await postProductNow(payload.product_id, payload.tenant_id);

      case "PREVIEW_POST":
        return await previewPost(payload.product_id, payload.options);

      case "UPDATE_POST_STATUS":
        return await updatePostStatus(
          payload.post_id,
          payload.status,
          payload.data
        );

      case "UPDATE_ENGAGEMENT_METRICS":
        return await updateEngagementMetrics(payload.post_id);

      case "CANCEL_POST":
        return await cancelPost(payload.post_id);

      case "RETRY_FAILED_POST":
        return await retryFailedPost(payload.post_id);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================
// MAIN: Process Pending Posts
// ============================================

async function processPendingPosts(tenant_id?: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results = [];

  try {
    // Build query
    let query = supabase
      .from("pending_facebook_posts")
      .select("*")
      .in("status", ["pending", "scheduled"])
      .order("scheduled_at", { ascending: true, nullsFirst: true })
      .limit(10);

    if (tenant_id) {
      query = query.eq("tenant_id", tenant_id);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    console.log(`📋 Found ${posts?.length || 0} pending posts`);

    for (const post of posts || []) {
      try {
        // Get Facebook config
        const { data: config } = await supabase
          .from("chatbot_facebook_settings")
          .select("*")
          .eq("tenant_id", post.tenant_id)
          .eq("is_connected", true)
          .single();

        if (!config || !config.access_token) {
          throw new Error("Facebook not configured");
        }

        // Check rate limit
        const canPost = await checkRateLimit(supabase, post.tenant_id, config);
        if (!canPost) {
          console.log(`⏸️ Rate limit reached for tenant ${post.tenant_id}`);
          continue;
        }

        // Update status to 'posting'
        await supabase
          .from("facebook_posts")
          .update({ status: "posting" })
          .eq("id", post.id);

        // Generate caption if empty
        let caption = post.caption;
        let hashtags = post.hashtags || [];

        if (!caption || caption.trim() === "") {
          console.log(`🤖 Generating caption for post ${post.id}...`);

          const generatedPost = await generatePostContent(post, config);
          caption = generatedPost.caption;
          hashtags = generatedPost.hashtags;

          // Update caption in database
          await supabase
            .from("facebook_posts")
            .update({
              caption,
              caption_preview: caption.substring(0, 60),
              hashtags,
              ai_metadata: generatedPost.metadata,
            })
            .eq("id", post.id);
        }

        // Post to Facebook
        console.log(`📤 Posting to Facebook for post ${post.id}...`);
        const fbResult = await postToFacebook({
          page_id: config.page_id,
          access_token: config.access_token,
          message: caption,
          images: post.image_urls,
          link: post.product_url,
        });

        // Update status to 'posted'
        await supabase
          .from("facebook_posts")
          .update({
            status: "posted",
            fb_post_id: fbResult.id || fbResult.post_id,
            posted_at: new Date().toISOString(),
            fb_response: fbResult,
          })
          .eq("id", post.id);

        results.push({
          success: true,
          post_id: post.id,
          fb_post_id: fbResult.id,
          product_name: post.product_name,
        });

        console.log(`✅ Posted successfully: ${post.product_name}`);

        // Wait between posts to avoid rate limit
        await new Promise((resolve) =>
          setTimeout(resolve, config.min_interval_minutes * 60 * 1000)
        );
      } catch (error) {
        console.error(`❌ Error posting ${post.id}:`, error);

        // Update status to 'failed'
        await supabase
          .from("facebook_posts")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
            retry_count: post.retry_count + 1,
          })
          .eq("id", post.id);

        results.push({
          success: false,
          post_id: post.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// ============================================
// POST_NOW: Manual publish one facebook_posts
// ============================================

async function postNow(post_id: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Lấy post cụ thể
  const { data: post, error } = await supabase
    .from("facebook_posts")
    .select("*")
    .eq("id", post_id)
    .maybeSingle();

  if (error || !post) {
    throw new Error("Post not found");
  }

  // Lấy config Facebook của tenant
  const { data: config } = await supabase
    .from("chatbot_facebook_settings")
    .select("*")
    .eq("tenant_id", post.tenant_id)
    .eq("is_connected", true)
    .maybeSingle();

  if (!config || !config.access_token || !config.page_id) {
    throw new Error("Facebook not configured");
  }

  // Đánh dấu đang đăng
  await supabase
    .from("facebook_posts")
    .update({ status: "posting" })
    .eq("id", post.id);

  // Nếu chưa có caption, generate nhanh từ product (giống processPendingPosts)
  let caption = post.caption;
  let hashtags = post.hashtags || [];
  if (!caption || caption.trim() === "") {
    const generatedPost = await generatePostContent(post, config);
    caption = generatedPost.caption;
    hashtags = generatedPost.hashtags;
    await supabase
      .from("facebook_posts")
      .update({
        caption,
        caption_preview: caption.substring(0, 60),
        hashtags,
        ai_metadata: generatedPost.metadata,
      })
      .eq("id", post.id);
  }

  // Đăng lên Facebook
  const fbResult = await postToFacebook({
    page_id: config.page_id,
    access_token: config.access_token,
    message: caption,
    images: post.image_urls,
    link: post.product_url,
  });

  // Cập nhật trạng thái
  const { error: updateError } = await supabase
    .from("facebook_posts")
    .update({
      status: "posted",
      fb_post_id: fbResult.id || fbResult.post_id,
      posted_at: new Date().toISOString(),
      fb_response: fbResult,
    })
    .eq("id", post.id);

  if (updateError) {
    throw updateError;
  }

  return new Response(
    JSON.stringify({
      success: true,
      post_id,
      fb_post_id: fbResult.id || fbResult.post_id,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================
// Generate Post Content with AI
// ============================================

async function generatePostContent(post: any, config: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get full product data
  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (image_url, display_order, is_primary),
      categories!inner (name, slug)
    `
    )
    .eq("id", post.product_id)
    .single();

  if (!product) {
    throw new Error("Product not found");
  }

  // Transform product data
  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    original_price: product.original_price,
    brand_name: product.brand_name,
    seo_title: product.seo_title,
    seo_description: product.seo_description,
    category: product.categories?.name,
    images: product.product_images
      ?.sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => img.image_url),
    stock: product.stock,
  };

  // Generate post
  const result = await generateFacebookPost({
    product: productData,
    postType: post.post_type as any,
    tone: post.post_tone || config.post_tone,
    includeHashtags: true,
    customHashtags: config.custom_hashtags || [],
  });

  if (!result.success || !result.posts || result.posts.length === 0) {
    throw new Error("Failed to generate post content");
  }

  return result.posts[0];
}

// ============================================
// Post to Facebook Graph API
// ============================================

async function postToFacebook(params: {
  page_id: string;
  access_token: string;
  message: string;
  images: string[];
  link?: string;
}) {
  const { page_id, access_token, message, images, link } = params;

  // Case 1: Multiple images (Photo Album)
  if (images && images.length > 1) {
    const uploaded_photos = [];

    // Step 1: Upload all photos (unpublished)
    for (const image_url of images) {
      try {
        const uploadRes = await fetch(
          `https://graph.facebook.com/v18.0/${page_id}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: image_url,
              published: false,
              access_token: access_token,
            }),
          }
        );

        const uploadData = await uploadRes.json();

        if (uploadData.error) {
          console.error("Photo upload error:", uploadData.error);
          continue;
        }

        if (uploadData.id) {
          uploaded_photos.push({ media_fbid: uploadData.id });
        }
      } catch (error) {
        console.error("Error uploading photo:", image_url, error);
      }
    }

    if (uploaded_photos.length === 0) {
      throw new Error("Failed to upload any photos");
    }

    // Step 2: Create album post with all photos
    const postRes = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          attached_media: uploaded_photos,
          access_token: access_token,
        }),
      }
    );

    const postData = await postRes.json();

    if (postData.error) {
      throw new Error(`Facebook API error: ${postData.error.message}`);
    }

    return postData;
  }

  // Case 2: Single image
  else if (images && images.length === 1) {
    const postRes = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: images[0],
          message: message,
          access_token: access_token,
        }),
      }
    );

    const postData = await postRes.json();

    if (postData.error) {
      throw new Error(`Facebook API error: ${postData.error.message}`);
    }

    return postData;
  }

  // Case 3: Text only with optional link
  else {
    const body: any = {
      message: message,
      access_token: access_token,
    };

    if (link) {
      body.link = link;
    }

    const postRes = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const postData = await postRes.json();

    if (postData.error) {
      throw new Error(`Facebook API error: ${postData.error.message}`);
    }

    return postData;
  }
}

// ============================================
// Check Rate Limit
// ============================================

async function checkRateLimit(
  supabase: any,
  tenant_id: string,
  config: any
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: recentPosts } = await supabase
    .from("facebook_posts")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("status", "posted")
    .gte("posted_at", oneHourAgo);

  const postsInLastHour = recentPosts?.length || 0;
  const maxPostsPerHour = Math.floor((config.max_posts_per_day || 10) / 3); // Distribute evenly

  return postsInLastHour < maxPostsPerHour;
}

// ============================================
// Post Product Now (Manual)
// ============================================

async function postProductNow(product_id: string, tenant_id: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get product data
  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (image_url, display_order, is_primary)
    `
    )
    .eq("id", product_id)
    .single();

  if (!product) {
    throw new Error("Product not found");
  }

  // Get Facebook config
  const { data: config } = await supabase
    .from("chatbot_facebook_settings")
    .select("*")
    .eq("tenant_id", tenant_id)
    .single();

  if (!config) {
    throw new Error("Facebook not configured");
  }

  // Get images
  const images = product.product_images
    ?.sort((a: any, b: any) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return a.display_order - b.display_order;
    })
    .map((img: any) => img.image_url)
    .slice(0, config.max_images || 10);

  // Create post record
  const { data: post, error: insertError } = await supabase
    .from("facebook_posts")
    .insert({
      tenant_id,
      fb_page_id: config.page_id,
      post_type: "manual",
      post_tone: config.post_tone,
      caption: "",
      image_urls: images,
      product_url: `https://yourdomain.com/product/${product.slug}`,
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
      triggered_by: "manual",
      status: "pending",
      scheduled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Process immediately
  return await processPendingPosts(tenant_id);
}

// ============================================
// Preview Post (without posting)
// ============================================

async function previewPost(product_id: string, options: any = {}) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (image_url, display_order, is_primary),
      categories!inner (name, slug)
    `
    )
    .eq("id", product_id)
    .single();

  if (!product) {
    throw new Error("Product not found");
  }

  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    original_price: product.original_price,
    brand_name: product.brand_name,
    seo_title: product.seo_title,
    seo_description: product.seo_description,
    category: product.categories?.name,
    images: product.product_images
      ?.sort((a: any, b: any) => a.display_order - b.display_order)
      .map((img: any) => img.image_url),
    stock: product.stock,
  };

  const result = await generateFacebookPost({
    product: productData,
    postType: options.postType || "product_showcase",
    tone: options.tone || "friendly",
    includeHashtags: options.includeHashtags !== false,
    customHashtags: options.customHashtags || [],
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================
// Update Post Status
// ============================================

async function updatePostStatus(post_id: string, status: string, data: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const updates: any = { status };

  if (status === "posted") {
    updates.posted_at = new Date().toISOString();
    if (data?.fb_post_id) updates.fb_post_id = data.fb_post_id;
    if (data?.fb_response) updates.fb_response = data.fb_response;
  }

  if (status === "failed") {
    if (data?.error_message) updates.error_message = data.error_message;
  }

  const { error } = await supabase
    .from("facebook_posts")
    .update(updates)
    .eq("id", post_id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: "Status updated" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================
// Update Engagement Metrics
// ============================================

async function updateEngagementMetrics(post_id: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: post } = await supabase
    .from("facebook_posts")
    .select("fb_post_id, tenant_id")
    .eq("id", post_id)
    .single();

  if (!post || !post.fb_post_id) {
    throw new Error("Post not found or not posted yet");
  }

  const { data: config } = await supabase
    .from("chatbot_facebook_settings")
    .select("access_token")
    .eq("tenant_id", post.tenant_id)
    .single();

  if (!config) {
    throw new Error("Facebook config not found");
  }

  // Get post insights from Facebook
  const insightsRes = await fetch(
    `https://graph.facebook.com/v18.0/${post.fb_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${config.access_token}`
  );

  const insights = await insightsRes.json();

  if (insights.error) {
    throw new Error(`Facebook API error: ${insights.error.message}`);
  }

  const metrics = {
    likes: insights.likes?.summary?.total_count || 0,
    comments: insights.comments?.summary?.total_count || 0,
    shares: insights.shares?.count || 0,
    reach: 0, // Requires Page Insights API
    clicks: 0,
    impressions: 0,
  };

  await supabase
    .from("facebook_posts")
    .update({ engagement_metrics: metrics })
    .eq("id", post_id);

  return new Response(
    JSON.stringify({ success: true, metrics }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================
// Cancel Post
// ============================================

async function cancelPost(post_id: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error } = await supabase
    .from("facebook_posts")
    .update({ status: "cancelled" })
    .eq("id", post_id)
    .in("status", ["pending", "scheduled", "failed"]);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: "Post cancelled" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================
// Retry Failed Post
// ============================================

async function retryFailedPost(post_id: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: post } = await supabase
    .from("facebook_posts")
    .select("retry_count")
    .eq("id", post_id)
    .single();

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.retry_count >= 3) {
    throw new Error("Maximum retry attempts reached");
  }

  const { error } = await supabase
    .from("facebook_posts")
    .update({
      status: "pending",
      error_message: null,
      scheduled_at: new Date().toISOString(),
    })
    .eq("id", post_id);

  if (error) throw error;

  // Process immediately
  return await processPendingPosts();
}
