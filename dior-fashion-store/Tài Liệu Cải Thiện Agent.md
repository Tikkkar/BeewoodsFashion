## 🎯 Mục tiêu cải thiện
[Mô tả ngắn gọn muốn cải thiện gì]

## 📁 Files đính kèm
1. ✅ prompts.ts
2. ✅ messageHandler.ts
3. ✅ [service cần sửa].ts
4. ✅ schema.sql (nếu cần thay đổi DB)

## 🐛 Vấn đề hiện tại
[Mô tả vấn đề, kèm screenshot/log nếu có]

## 💡 Ý tưởng cải thiện
[Nếu có ý tưởng sơ bộ]

## 📊 Data mẫu
[Ví dụ về conversation flow, test cases]
```

---

## 🎯 **QUICK REFERENCE THEO VẤN ĐỀ**

### **Nếu muốn cải thiện CONVERSATION FLOW:**
```
Gửi:
1. ✅ prompts.ts
2. ✅ messageHandler.ts
3. ✅ Log conversation (screenshot)
```

### **Nếu muốn cải thiện ORDER PROCESS:**
```
Gửi:
1. ✅ prompts.ts (phần order flow)
2. ✅ orderHandler.ts
3. ✅ chatbotOrderService.ts
4. ✅ schema.sql (bảng orders, chatbot_orders)
```

### **Nếu muốn cải thiện MEMORY/CONTEXT:**
```
Gửi:
1. ✅ prompts.ts
2. ✅ contextService.ts
3. ✅ memoryService.ts
4. ✅ schema.sql (bảng memory-related)
```

### **Nếu muốn cải thiện AI RESPONSE QUALITY:**
```
Gửi:
1. ✅ prompts.ts (quan trọng nhất!)
2. ✅ geminiService.ts
3. ✅ Example conversations (good & bad)
```

### **Nếu có LỖI/BUG:**
```
Gửi:
1. ✅ Screenshot/log lỗi
2. ✅ File liên quan (handler/service)
3. ✅ Step to reproduce
```

---

## 💾 **CÁC FILE BẠN ĐÃ CHIA SẺ (Reference)**

Từ conversation này, bạn đã gửi:
1. ✅ Schema database (document #2, #7)
2. ✅ prompts.ts (document #1, #11)
3. ✅ messageHandler.ts (document #9)
4. ✅ orderHandler.ts (document #10)
5. ✅ memoryService.ts (document #5)
6. ✅ Handover document (document #3)

→ **Nếu cần cải thiện, chỉ cần gửi file cụ thể muốn sửa + mô tả vấn đề!**

---

## 🚀 **TIPS ĐỂ GET BETTER HELP**

### ✅ **DO:**
1. **Mô tả rõ vấn đề**: "AI cứ hỏi lại địa chỉ" thay vì "AI không hoạt động"
2. **Kèm example**: Screenshot conversation thực tế
3. **Gửi file liên quan**: Chỉ gửi file cần sửa, không cần gửi hết
4. **Nêu expected behavior**: "Tôi muốn AI làm X thay vì Y"

### ❌ **DON'T:**
1. Chỉ nói "sửa giúp tôi" mà không rõ sửa gì
2. Gửi quá nhiều file không liên quan
3. Không kèm log/screenshot khi có bug
4. Quên nói đang dùng AI model gì (Gemini/Claude)

---

## 📌 **TÓM TẮT**

**Minimum để cải thiện:**
```
1. prompts.ts
2. File service/handler liên quan
3. Mô tả vấn đề rõ ràng
```

**Optimal để cải thiện:**
```
1. prompts.ts
2. messageHandler.ts
3. Service files liên quan
4. schema.sql (nếu liên quan DB)
5. Screenshots/logs
6. Test cases/examples