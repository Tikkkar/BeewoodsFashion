// ==================================================
// services/geminiAdTargetingService.v4.ts
// Phiên bản nâng cấp, yêu cầu 3-5 mục cho mỗi
// danh sách và làm rõ "Hành vi liên quan công việc".
// ==================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore
const apiKey = process.env?.REACT_APP_GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("⚠️ API Key của Gemini chưa được thiết lập. Vui lòng kiểm tra file .env");
}
const genAI = new GoogleGenerativeAI(apiKey as string);

// --- Định nghĩa Interfaces ---

/**
 * Dữ liệu đầu vào để yêu cầu gợi ý targeting.
 */
export interface AdTargetingRequest {
  imageData: string; // Base64 hoặc URL của hình ảnh
  productName?: string; // Tên sản phẩm
  productCategory?: string; // Danh mục
  additionalContext?: string; // Thông tin bổ sung (v.d., "Hàng cao cấp", "Giá rẻ")
}

/**
 * Cấu trúc cho một tùy chọn targeting (một nhóm đối tượng chi tiết).
 */
export interface TargetingOption {
  optionName: string;
  summary: string;
  demographics: {
    ageRange: string[];
    gender: string[];
    location: string[];
  };
  jobDetails: {
    specificJobs: string[];
    jobRelatedBehaviors: string[];
  };
  lifestyleAndInterests: {
    relevantInterests: string[];
    placesTheyGo: string[];
    toolsTheyUse: string[];
  };
  psychographics: {
    painPoints: string[];
    goals: string[];
    motivations: string[];
  };
  mediaConsumption: {
    influencersOrCreators: string[];
    publicationsOrBlogs: string[];
    preferredSocialPlatforms: string[];
  };
  creativeAngle: {
    mainMessage: string;
    suggestedHooks: string[];
  };
  facebookTargeting: {
    detailedInterests: string[];
    detailedBehaviors: string[];
    detailedDemographics: string[];
    exclusions: string[];
  };
}

/**
 * Cấu trúc trả về chính, chứa phân tích sản phẩm và 3 tùy chọn targeting.
 */
export interface FacebookAdTargetingResponse {
  productAnalysis: string;
  targetingOptions: TargetingOption[];
}

// --- Các hàm tiện ích ---

/**
 * Phân tích chuỗi JSON trả về từ AI một cách an toàn.
 * @param text Chuỗi văn bản thô từ Gemini
 * @returns Đối tượng JSON
 */
function parseGeminiJSON(text: string): any {
  let cleanText = text.trim();
  
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\n?/g, "").replace(/\n?```$/g, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\n?/g, "").replace(/\n?```$/g, "");
  }

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("❌ Không thể phân tích JSON:", cleanText.substring(0, 300));
    if (error instanceof SyntaxError) {
      const position = error.message.match(/position (\d+)/);
      if (position) {
        const charPos = parseInt(position[1], 10);
        const snippet = cleanText.substring(Math.max(0, charPos - 20), Math.min(cleanText.length, charPos + 20));
        console.error(`Lỗi cú pháp gần vị trí ${charPos}: ...${snippet}...`);
      }
    }
    throw new Error("AI trả về định dạng JSON không hợp lệ. Vui lòng thử lại.");
  }
}

/**
 * Chuyển đổi Blob (từ fetch) sang chuỗi Base64.
 * @param blob Dữ liệu Blob
 * @returns Chuỗi Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- Hàm xây dựng Prompt ---

/**
 * Xây dựng prompt chi tiết cho Gemini, yêu cầu 3 tùy chọn đối tượng sâu sắc.
 * @param request Dữ liệu đầu vào
 * @returns Chuỗi prompt cho Gemini
 */
function buildAdTargetingPrompt(request: AdTargetingRequest): string {
  const { productName, productCategory, additionalContext } = request;
  
  // Cấu trúc JSON mẫu, với ví dụ chứa 3-5 mục để AI học theo.
  const jsonStructure = `
{
  "product_analysis": "Phân tích ngắn gọn về sản phẩm và đối tượng tiềm năng.",
  "targeting_options": [
    {
      "option_name": "Nhóm 1: Lập trình viên Front-End (Mid-level)",
      "summary": "Nhóm này có thu nhập ổn định, đánh giá cao công nghệ và sẵn sàng chi trả cho các sản phẩm giúp họ làm việc hiệu quả và giải trí tốt hơn.",
      "demographics": {
        "age_range": ["26-35"],
        "gender": ["Nam", "Nữ"],
        "location": ["Thành phố Hồ Chí Minh", "Hà Nội", "Đà Nẵng"]
      },
      "job_details": {
        "specific_jobs": ["Front-End Developer", "UI Developer", "ReactJS Developer", "VueJS Developer"],
        "job_related_behaviors": [
          "Thường xuyên làm việc khuya để kịp deadline",
          "Tham gia các cộng đồng lập trình trên Facebook, Discord",
          "Dành thời gian đọc blog công nghệ (Medium, Dev.to)",
          "Luôn tìm kiếm các khóa học mới trên Udemy hoặc Coursera"
        ]
      },
      "lifestyle_and_interests": {
        "relevant_interests": ["Công nghệ mới", "Gaming (PC/Console)", "Bàn phím cơ", "Nhạc Lo-fi"],
        "places_they_go": ["Các quán cà phê co-working", "Sự kiện công nghệ (meetup)", "Cửa hàng bán đồ công nghệ (Phong Vũ, FPT Shop)", "Các diễn đàn online như Reddit (r/vietnam, r/MechanicalKeyboards)"],
        "tools_they_use": ["Visual Studio Code", "Figma", "GitHub", "Slack", "MacBook Pro hoặc Laptop cấu hình cao"]
      },
      "psychographics": {
        "pain_points": ["Mỏi mắt và đau lưng khi ngồi làm việc lâu", "Cảm thấy bị cô lập khi làm việc từ xa", "Khó tập trung trong môi trường ồn ào", "Cần không gian làm việc tối ưu và truyền cảm hứng"],
        "goals": ["Tăng năng suất code", "Cải thiện cân bằng công việc-cuộc sống", "Giữ sức khỏe thể chất và tinh thần", "Thể hiện cá tính qua góc làm việc"],
        "motivations": ["Sự hiệu quả", "Sự thoải mái", "Đam mê công nghệ", "Tính thẩm mỹ"]
      },
      "media_consumption": {
        "influencers_or_creators": ["Tôi đi code dạo (Phạm Huy Hoàng)", "evondev", "Fireship.io", "Marques Brownlee (MKBHD)"],
        "publications_or_blogs": ["Vietcetera", "TechCrunch", "The Verge", "CSS-Tricks", "Smashing Magazine"],
        "preferred_social_platforms": ["Facebook (trong các group)", "LinkedIn", "YouTube", "Reddit"]
      },
      "creative_angle": {
        "main_message": "Sản phẩm X - Nâng cấp trải nghiệm code, khơi nguồn sáng tạo.",
        "suggested_hooks": [
          "Dân dev có 3 thứ không thể thiếu: code, cà phê và ...",
          "Biến góc làm việc thành trạm năng lượng cho mọi deadline.",
          "Đừng để sự khó chịu cắt ngang dòng code của bạn."
        ]
      },
      "facebook_targeting": {
        "detailed_interests": ["ReactJS", "Web development", "GitHub", "Visual Studio Code", "Mechanical keyboard"],
        "detailed_behaviors": ["Người dùng thiết bị máy tính để bàn cao cấp", "Quản trị viên trang công nghệ", "Người có khả năng tiếp cận công nghệ sớm"],
        "detailed_demographics": ["Chức danh: Developer", "Ngành: Máy tính và Toán học", "Học vấn: Đại học"],
        "exclusions": ["Người dùng thiết bị di động cấp thấp", "Chơi game trên di động (hành vi)", "Hành chính văn phòng"]
      }
    }
    // ... thêm 2 nhóm đối tượng tương tự với cùng độ chi tiết ...
  ]
}
`;

  return `Bạn là một Giám đốc Chiến lược Marketing (Marketing Strategist) hàng đầu, có kinh nghiệm sâu sắc về quảng cáo Facebook và tâm lý người dùng.
Nhiệm vụ của bạn là phân tích sản phẩm và đề xuất 3 NHÓM ĐỐI TƯỢNG chi tiết và sâu sắc.

**Thông tin sản phẩm:**
${productName ? `🏷️ Tên sản phẩm: ${productName}` : ""}
${productCategory ? `📦 Danh mục: ${productCategory}` : ""}
${additionalContext ? `📝 Bối cảnh/Ghi chú thêm: ${additionalContext}` : ""}

**YÊU CẦU CỐ ĐỊNH:**
1.  **Phân tích sâu:** Phân tích hình ảnh và thông tin để hiểu rõ sản phẩm.
2.  **Đề xuất 3 nhóm:** Cung cấp chính xác 3 nhóm đối tượng riêng biệt, không trùng lặp.
3.  **Chi tiết hóa hành vi:** Với mục \`job_related_behaviors\`, hãy mô tả những hành động, thói quen cụ thể gắn liền với công việc hàng ngày của họ. (Ví dụ: Kế toán viên sẽ 'Thường xuyên truy cập các trang web của cơ quan thuế', 'Sử dụng Excel và MISA hàng ngày', 'Tham gia các nhóm hỗ trợ quyết toán thuế trên Facebook').
4.  **QUAN TRỌNG - Đảm bảo số lượng:** Với TẤT CẢ các mục là danh sách (có dấu \`[]\`), hãy cung cấp TỪ 3 ĐẾN 5 gợi ý. Ví dụ: 3-5 \`specific_jobs\`, 3-5 \`pain_points\`, 3-5 \`detailed_interests\`, v.v. Điều này là bắt buộc để đảm bảo kết quả đủ chi tiết để sử dụng.

Vui lòng trả về KẾT QUẢ DUY NHẤT ở định dạng JSON theo cấu trúc sau. KHÔNG thêm bất kỳ văn bản nào trước hoặc sau khối JSON.

${jsonStructure}
`;
}

// --- Hàm xử lý chính ---

/**
 * Gọi Gemini API để phân tích hình ảnh và thông tin sản phẩm, trả về 3 tùy chọn targeting chi tiết.
 * @param request Dữ liệu đầu vào chứa hình ảnh và thông tin sản phẩm.
 * @returns Promise chứa đối tượng FacebookAdTargetingResponse.
 */
export async function generateAdTargeting(request: AdTargetingRequest): Promise<FacebookAdTargetingResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Sử dụng model flash cho tốc độ nhanh hoặc "gemini-1.5-pro" để có kết quả sâu hơn
      generationConfig: { 
        temperature: 0.6, // Tăng nhẹ để AI sáng tạo hơn trong các gợi ý
        maxOutputTokens: 32768,
        responseMimeType: "application/json",
      },
      systemInstruction: "Bạn là chuyên gia Marketing Strategist. Chỉ trả lời bằng JSON theo cấu trúc được yêu cầu. Không thêm markdown hay giải thích."
    });

    // Xử lý hình ảnh (Base64 hoặc URL)
    let imagePart: any;
    if (request.imageData.startsWith("data:image")) {
      // Xử lý chuỗi Base64
      const [header, data] = request.imageData.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1];
      if (!data || !mimeType) {
        throw new Error("Định dạng Base64 của hình ảnh không hợp lệ.");
      }
      imagePart = { inlineData: { data, mimeType } };
    } else {
      // Xử lý URL
      const response = await fetch(request.imageData);
      if (!response.ok) {
        throw new Error(`Không thể tải hình ảnh từ URL: ${response.statusText}`);
      }
      const blob = await response.blob();
      const base64String = await blobToBase64(blob);
      const data = base64String.split(",")[1];
      imagePart = { inlineData: { data, mimeType: blob.type } };
    }

    const prompt = buildAdTargetingPrompt(request);
    
    // Gửi prompt (văn bản) và hình ảnh đến Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed: any = parseGeminiJSON(text);

    // Map dữ liệu JSON từ AI sang Interface của TypeScript một cách an toàn
    const targetingOptions: TargetingOption[] = (parsed.targeting_options || []).map((opt: any) => ({
      optionName: opt.option_name || "N/A",
      summary: opt.summary || "",
      demographics: {
        ageRange: opt.demographics?.age_range || [],
        gender: opt.demographics?.gender || [],
        location: opt.demographics?.location || [],
      },
      jobDetails: {
        specificJobs: opt.job_details?.specific_jobs || [],
        jobRelatedBehaviors: opt.job_details?.job_related_behaviors || [],
      },
      lifestyleAndInterests: {
        relevantInterests: opt.lifestyle_and_interests?.relevant_interests || [],
        placesTheyGo: opt.lifestyle_and_interests?.places_they_go || [],
        toolsTheyUse: opt.lifestyle_and_interests?.tools_they_use || [],
      },
      psychographics: {
        painPoints: opt.psychographics?.pain_points || [],
        goals: opt.psychographics?.goals || [],
        motivations: opt.psychographics?.motivations || [],
      },
      mediaConsumption: {
        influencersOrCreators: opt.media_consumption?.influencers_or_creators || [],
        publicationsOrBlogs: opt.media_consumption?.publications_or_blogs || [],
        preferredSocialPlatforms: opt.media_consumption?.preferred_social_platforms || [],
      },
      creativeAngle: {
        mainMessage: opt.creative_angle?.main_message || "",
        suggestedHooks: opt.creative_angle?.suggested_hooks || [],
      },
      facebookTargeting: {
        detailedInterests: opt.facebook_targeting?.detailed_interests || [],
        detailedBehaviors: opt.facebook_targeting?.detailed_behaviors || [],
        detailedDemographics: opt.facebook_targeting?.detailed_demographics || [],
        exclusions: opt.facebook_targeting?.exclusions || [],
      },
    }));

    return {
      productAnalysis: parsed.product_analysis || "Không có phân tích sản phẩm.",
      targetingOptions: targetingOptions,
    };
    
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng trong quá trình tạo targeting:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể phân tích targeting từ AI. Vui lòng kiểm tra API key, kết nối mạng và định dạng hình ảnh.");
  }
}