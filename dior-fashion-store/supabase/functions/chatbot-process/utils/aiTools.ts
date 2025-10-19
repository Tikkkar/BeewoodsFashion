// ============================================
// utils/aiTools.ts - AI Function Definitions
// ============================================

export const GEMINI_TOOLS = [
  {
    name: "save_customer_info",
    description: "Lưu hoặc cập nhật thông tin cá nhân khách hàng (tên, SĐT, chiều cao, cân nặng, size, phong cách). Gọi ngay khi khách cung cấp thông tin này.",
    parameters: {
      type: "object",
      properties: {
        full_name: {
          type: "string",
          description: "Tên đầy đủ của khách hàng"
        },
        preferred_name: {
          type: "string",
          description: "Tên thân mật, biệt danh"
        },
        phone: {
          type: "string",
          description: "Số điện thoại liên hệ (10 số)"
        },
        height: {
          type: "number",
          description: "Chiều cao (cm), từ 100-250"
        },
        weight: {
          type: "number",
          description: "Cân nặng (kg), từ 30-200"
        },
        usual_size: {
          type: "string",
          enum: ["XS", "S", "M", "L", "XL", "XXL"],
          description: "Size thường mặc"
        },
        style_preference: {
          type: "array",
          items: { type: "string" },
          description: "Phong cách yêu thích ['công sở', 'dạo phố', 'thanh lịch'...]"
        }
      }
    }
  },
  {
  name: "save_address",
  description: `Lưu địa chỉ giao hàng.

⚠️ QUAN TRỌNG - Phân biệt địa chỉ và mô tả sản phẩm:
- Địa chỉ: "198 Hoàng Hoa Thám, Ba Đình, Hà Nội"
- MÔ TẢ sản phẩm: "3 lớp cao cấp", "set vest xám tro" ← KHÔNG PHẢI địa chỉ!

CÁCH NHẬN DIỆN địa chỉ:
✅ Bắt đầu bằng SỐ NHÀ (198, 45A, 123...)
✅ Có TÊN ĐƯỜNG (Hoàng Hoa Thám, Nguyễn Trãi...)
✅ Có QUẬN/HUYỆN (Ba Đình, Quận 1...)
✅ Có THÀNH PHỐ (Hà Nội, TP.HCM...)

❌ KHÔNG PHẢI địa chỉ:
- "3 lớp cao cấp" ← Mô tả sản phẩm
- "set vest quần" ← Tên sản phẩm
- "xám tro" ← Màu sắc

VÍ DỤ input khó:
"Set vest 3 lớp cao cấp tới địa chỉ 198 Hoàng Hoa Thám, Ba Đình, Hà Nội"
→ Chỉ lấy PHẦN SAU "tới địa chỉ":
  address_line: "198 Hoàng Hoa Thám"
  district: "Ba Đình"
  city: "Hà Nội"`,
  parameters: {
    type: "object",
    properties: {
      address_line: {
        type: "string",
        description: "SỐ NHÀ + TÊN ĐƯỜNG. PHẢI bắt đầu bằng số. VD: '198 Hoàng Hoa Thám'. TUYỆT ĐỐI KHÔNG bao gồm mô tả sản phẩm như 'cao cấp', '3 lớp'..."
      },
      district: {
        type: "string",
        description: "Quận/Huyện. VD: 'Ba Đình', 'Quận 1'"
      },
      city: {
        type: "string",
        description: "Thành phố. VD: 'Hà Nội', 'TP Hồ Chí Minh'"
      },
      phone: {
        type: "string",
        description: "Số điện thoại (10-11 số)"
      }
    },
    required: ["address_line", "city"]
  }
}
];

// Tool usage instructions for system prompt
export const TOOL_INSTRUCTIONS = `
===== CÔNG CỤ LƯU DỮ LIỆU =====

Bạn có 4 công cụ để tương tác với database:

🔧 1. save_customer_info - Lưu thông tin cá nhân
GỌI KHI: Khách cung cấp tên, SĐT, chiều cao, cân nặng, size, phong cách...

VD: "Em tên Lan, 1m65, 50kg, thích váy công sở"
→ save_customer_info({
  preferred_name: "Lan",
  height: 165,
  weight: 50,
  style_preference: ["công sở", "váy"]
})

🔧 2. save_address - Lưu địa chỉ giao hàng
GỌI KHI: Khách cung cấp địa chỉ ĐẦY ĐỦ

VD: "123 Lê Lợi, phường Bến Nghé, quận 1, TPHCM, 0901234567"
→ save_address({
  address_line: "123 Lê Lợi",
  ward: "Phường Bến Nghé",
  district: "Quận 1",
  city: "TP Hồ Chí Minh",
  phone: "0901234567"
})

🔧 3. add_to_cart - Thêm vào giỏ
GỌI KHI: Khách chọn sản phẩm + size

VD: "Lấy cái váy đen size M"
→ add_to_cart({
  product_id: "[UUID từ context.products]",
  size: "M",
  quantity: 1
})

🔧 4. confirm_and_create_order - Tạo đơn hàng
FLOW:
1. Bot: "Dạ chị vẫn giao về [ĐỊA CHỈ] phải không ạ?"
2. Khách: "Được"/"Ok"/"Đúng"
3. → GỌI: confirm_and_create_order({ confirmed: true })

⚠️ QUY TẮC:
- GỌI function NGAY khi có đủ thông tin
- SAU KHI gọi → Đợi kết quả → Thông báo cho khách
- KHÔNG tự bịa dữ liệu
- Thiếu thông tin → HỎI khách trước
`;