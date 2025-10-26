
  1. Mục Tiêu & Bối Cảnh

  Dự án này là một hệ thống chatbot AI được thiết kế cho một cửa hàng thời trang (tên "BeWo" trong code). Mục
  tiêu chính là tự động hóa quy trình tương tác và bán hàng với khách hàng qua các nền tảng như Facebook
  Messenger và website. Chatbot không chỉ trả lời câu hỏi mà còn đóng vai trò như một nhân viên tư vấn chuyên
  nghiệp, có khả năng gợi ý sản phẩm, quản lý giỏ hàng và tạo đơn hàng hoàn chỉnh, giúp giảm tải công việc cho
  nhân viên và tăng trải nghiệm khách hàng.

  2. Kiến Trúc Chính & Công Nghệ Cốt Lõi

  Hệ thống được xây dựng trên kiến trúc serverless, xử lý sự kiện theo thời gian thực.

   * Nền tảng (Platform): Supabase Edge Function, chạy trên môi trường Deno. Điều này đảm bảo khả năng mở rộng
     cao và độ trễ thấp.
   * Lõi AI (AI Core): Sử dụng mô hình ngôn ngữ lớn Google Gemini (gemini-2.0-flash-exp) thông qua thư viện
     @google/generative-ai. Điểm đặc biệt là hệ thống tận dụng triệt để khả năng Function Calling (gọi hàm) của
     Gemini, biến chatbot thành một AI agent có khả năng thực thi hành động.
   * Kiến trúc RAG (Retrieval-Augmented Generation):
       * Retrieval (Truy xuất): Trước mỗi lượt hội thoại, hệ thống truy xuất một bối cảnh (context) toàn diện từ
         cơ sở dữ liệu Supabase (PostgreSQL), bao gồm: thông tin khách hàng (profile), lịch sử trò chuyện, địa
         chỉ đã lưu, giỏ hàng hiện tại, và danh sách sản phẩm có liên quan.
       * Augmentation (Bổ sung): Bối cảnh này được định dạng và đưa vào một system prompt cực kỳ chi tiết (trong
         utils/prompts.ts), đóng vai trò là "bộ não" và quy trình vận hành cho AI.
       * Generation (Tạo sinh): Gemini tạo ra câu trả lời và các lệnh gọi hàm (function calls) dựa trên bối cảnh
         đã được bổ sung.
   * Cơ sở dữ liệu: Supabase (PostgreSQL) được dùng để lưu trữ toàn bộ dữ liệu vận hành: conversations,
     chatbot_messages, customer_profiles, products, carts, chatbot_orders, và các vector embeddings (sử dụng
     pgvector).
   * Ngôn ngữ: TypeScript.

  3. Chức Năng Chính

   * Tư vấn bán hàng theo quy trình 6 giai đoạn: AI được lập trình để tuân theo một quy trình tư vấn chuyên
     nghiệp (định nghĩa trong utils/prompts.ts), từ Chào hỏi & Hiểu nhu cầu -> Tư vấn sản phẩm -> Xác nhận quan
     tâm -> Quản lý giỏ hàng -> Đặt hàng -> Hỗ trợ sau bán.
   * AI Agent với khả năng thực thi (Function Calling): Chatbot có thể chủ động thực hiện các tác vụ thông qua
     các hàm được định nghĩa trong utils/aiTools.ts:
       * save_customer_info: Lưu thông tin khách hàng (tên, SĐT, sở thích).
       * save_address: Trích xuất và lưu địa chỉ giao hàng.
       * add_to_cart: Thêm sản phẩm vào giỏ hàng.
       * confirm_and_create_order: Xác nhận và tạo đơn hàng.
   * Quản lý trạng thái & Bối cảnh: Toàn bộ trạng thái hội thoại (giỏ hàng, thông tin khách) được duy trì trong
     CSDL, cho phép các cuộc trò chuyện kéo dài và liền mạch.
   * Xử lý đơn hàng tự động: handlers/orderHandler.ts chịu trách nhiệm cho toàn bộ luồng checkout, kiểm tra các
     điều kiện cần thiết (profile, địa chỉ, giỏ hàng) trước khi tạo đơn và đồng bộ vào hệ thống đơn hàng chính.
   * Gợi ý sản phẩm thông minh: AI có thể gợi ý sản phẩm và quyết định định dạng hiển thị (dạng thẻ product_card
     hoặc chỉ đề cập bằng text) dựa trên ngữ cảnh.

  4. Hướng Dẫn Nhanh cho AI Kế Thừa

   * Điểm khởi đầu (Entry Point): index.ts. Đây là nơi tiếp nhận tất cả các request.
   * Luồng xử lý chính (Core Flow): Nằm trong handlers/messageHandler.ts. Đây là file điều phối chính, thực hiện
     chuỗi hành động: lấy bối cảnh -> gọi Gemini -> thực thi hàm (nếu có) -> gửi phản hồi.
   * "Bộ não" của AI: Nằm trong utils/prompts.ts. File này định nghĩa nhân cách, quy tắc, quy trình tư vấn và
     cách AI nên phản hồi trong các tình huống khác nhau. Đây là nơi quan trọng nhất để tinh chỉnh hành vi của
     bot.
   * Năng lực của AI (Tools): Được định nghĩa trong utils/aiTools.ts. Đây là danh sách các "công cụ" mà AI có thể
     sử dụng. Để thêm chức năng mới cho bot, cần bắt đầu từ đây.
   * Tương tác với dịch vụ ngoài: Được trừu tượng hóa trong thư mục services/. Ví dụ, geminiService.ts giao tiếp
     với Google AI, facebookService.ts gửi tin nhắn tới Messenger.
  1. Thư mục gốc (`/`)

   * deno.json
       * Mô tả: Là file cấu hình chính cho môi trường Deno. Nó định nghĩa các thư viện bên ngoài được nhập vào dự
         án, như @google/generative-ai và @supabase/supabase-js, đồng thời thiết lập các tùy chọn cho trình biên
         dịch TypeScript.
       * Quan hệ: Là file nền tảng, được môi trường Supabase Edge Function sử dụng để biết cần tải về và sử dụng
         những thư viện nào khi chạy code.

   * index.ts
       * Mô tả: Đây là điểm vào (entry point) của toàn bộ Supabase Function. Nó khởi tạo một server, lắng nghe
         các request HTTP (chủ yếu là webhook từ Facebook hoặc request từ client web), xử lý CORS và chuyển toàn
         bộ nội dung request đến messageHandler để xử lý logic.
       * Quan hệ: Tương tác trực tiếp với handlers/messageHandler.ts (chuyển tiếp request) và utils/cors.ts (sử
         dụng headers).

  2. Thư mục: `handlers/`

   * messageHandler.ts
       * Mô tả: Đây là file điều phối viên (orchestrator) cốt lõi của chatbot. Nó nhận một tin nhắn, thực hiện
         một chuỗi các hành động: tạo hoặc lấy thông tin cuộc hội thoại, xây dựng bối cảnh (context), gọi Gemini
         để sinh phản hồi và các lệnh gọi hàm (function calls), thực thi các hàm đó, và cuối cùng là lưu lại log
         và gửi tin nhắn trả lời.
       * Quan hệ: Tương tác với hầu hết các module khác: services/contextService.ts (để xây dựng bối cảnh),
         services/geminiService.ts (để có phản hồi AI), handlers/orderHandler.ts (để xử lý ý định đặt hàng), và
         nhiều service khác để thực thi function call.
       * Hàm cốt lõi: handleMessage(body)

   * orderHandler.ts
       * Mô tả: Chuyên xử lý logic liên quan đến việc tạo đơn hàng. Nó kiểm tra các điều kiện tiên quyết như
         khách hàng đã có thông tin, địa chỉ và sản phẩm trong giỏ hàng hay chưa. Nếu đủ điều kiện, nó sẽ gọi
         service để tạo đơn hàng và định dạng một tin nhắn xác nhận thành công.
       * Quan hệ: Được gọi bởi messageHandler.ts khi phát hiện ý định đặt hàng. Tương tác với
         services/chatbotOrderService.ts (để tạo đơn hàng trong DB), services/cartService.ts (để lấy sản phẩm),
         và services/addressExtractionService.ts (để lấy địa chỉ).
       * Hàm cốt lõi: handleOrderCreation(body)

  3. Thư mục: `services/`

   * geminiService.ts
       * Mô tả: Module này đóng vai trò là cầu nối giao tiếp với Google Gemini API. Nó nhận bối cảnh và tin nhắn
         người dùng, xây dựng một prompt hoàn chỉnh, gửi đến Gemini, sau đó phân tích và trả về phản hồi dạng
         JSON bao gồm cả text và các function calls.
       * Quan hệ: Được gọi bởi messageHandler.ts. Sử dụng utils/prompts.ts để xây dựng prompt.
       * Hàm cốt lõi: callGemini(context, userMessage), callGeminiWithFunctionResult(...)

   * contextService.ts
       * Mô tả: Chịu trách nhiệm thu thập và tổng hợp tất cả dữ liệu cần thiết để tạo thành bối cảnh (context) cho
          một lượt hội thoại. Nó truy vấn thông tin khách hàng, lịch sử chat, sản phẩm, địa chỉ đã lưu, và các "ký
          ức" dài hạn từ CSDL.
       * Quan hệ: Được gọi bởi messageHandler.ts. Tương tác với nhiều service khác như memoryService.ts và
         addressExtractionService.ts.
       * Hàm cốt lõi: buildContext(supabase, conversationId, message)

   * cartService.ts
       * Mô tả: Quản lý toàn bộ logic giỏ hàng. Nó cung cấp các hàm để lấy, thêm, cập nhật số lượng hoặc xóa sản
         phẩm khỏi giỏ hàng của một cuộc hội thoại. Dữ liệu giỏ hàng được lưu trong một trường JSON của bảng
         chatbot_conversations.
       * Quan hệ: Được sử dụng bởi messageHandler.ts (khi thực thi function call add_to_cart) và orderHandler.ts
         (khi kiểm tra giỏ hàng trước lúc tạo đơn).
       * Hàm cốt lõi: getOrCreateCart(), addToCart(), clearCart()

   * chatbotOrderService.ts
       * Mô tả: Chịu trách nhiệm ghi một đơn hàng mới vào bảng chatbot_orders trong CSDL. Nó tính toán tổng tiền,
         chuẩn bị dữ liệu và thực hiện lệnh insert.
       * Quan hệ: Được gọi bởi orderHandler.ts sau khi tất cả các điều kiện đặt hàng đã được thỏa mãn.
       * Hàm cốt lõi: createChatbotOrder(data)

   * addressService.ts
       * Mô tả: Xử lý việc lưu và truy xuất địa chỉ của khách hàng một cách có cấu trúc. Nó có logic để phân biệt
         người dùng đã đăng nhập (lưu vào bảng addresses) và khách (lưu vào customer_profiles) để tối ưu hóa.
       * Quan hệ: Được messageHandler.ts gọi khi thực thi function call save_address.
       * Hàm cốt lõi: saveAddressStandardized(), getStandardizedAddress()

  4. Thư mục: `utils/`

   * prompts.ts
       * Mô tả: Đây là "bộ não" của AI. File này chứa logic để xây dựng một system prompt cực kỳ chi tiết, bao
         gồm nhân cách của bot, thông tin cửa hàng, chính sách, quy trình tư vấn 6 giai đoạn, và quan trọng nhất
         là hướng dẫn chi tiết về cách sử dụng các công cụ (function calling).
       * Quan hệ: Được geminiService.ts sử dụng để tạo prompt hoàn chỉnh trước khi gửi đến AI. Tương tác với
         utils/aiTools.ts để nhúng định nghĩa công cụ vào prompt.
       * Hàm cốt lõi: buildFullPrompt(context, userMessage)

   * aiTools.ts
       * Mô tả: File này định nghĩa "hộp công cụ" (toolbox) mà AI có thể sử dụng. Nó chứa cả hướng dẫn bằng ngôn
         ngữ tự nhiên và schema JSON cho từng hàm (như save_address, add_to_cart), giúp Gemini hiểu rõ khi nào và
         làm thế nào để gọi một hàm.
       * Quan hệ: Được prompts.ts nhúng vào system prompt. Cung cấp "luật chơi" cho AI.
       * Biến cốt lõi: TOOL_INSTRUCTIONS, AI_TOOLS_SCHEMA

   * supabaseClient.ts
       * Mô tả: Một file tiện ích đơn giản nhưng quan trọng, có nhiệm vụ tạo và trả về một đối tượng client để
         tương tác với Supabase. Nó lấy URL và khóa (key) từ biến môi trường để đảm bảo an toàn.
       * Quan hệ: Được import và sử dụng bởi hầu hết mọi file service và handler cần truy vấn CSDL.
       * Hàm cốt lõi: createSupabaseClient()