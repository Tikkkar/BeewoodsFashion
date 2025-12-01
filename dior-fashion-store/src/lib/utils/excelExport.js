import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportShipmentsToExcel = (shipments, filename = null) => {
    if (!shipments || shipments.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
    }

    // --- 1. CHUẨN BỊ DỮ LIỆU HEADER (TUYỆT ĐỐI KHÔNG SỬA) ---

    // Dòng 1: Header nhóm (Group Header) - Sẽ được merge
    const row1 = [
        "STT",
        "Thông tin người nhận", "", "", "", // Dành cho merge (Cột 2,3,4,5)
        "Dịch vụ vận chuyển",
        "Hình thức lấy hàng",
        "Phương thức thanh toán Ship",
        "Hàng hóa", "", "", "", "", "", "", "", "", "", // Dành cho merge (Cột 9->18)
        "Ghi chú"
    ];

    // Dòng 2: Header chi tiết (Khớp từng ký tự với mẫu J&T)
    const row2 = [
        "STT",
        "Tên người nhận (*)",
        "Số điện thoại (*)",
        "Địa chỉ chi tiết (*)",
        "Mã đơn hàng riêng",
        "Loại dịch vụ (*)",
        "Gửi tại bưu cục",
        "Phương thức thanh toán (*)",
        "Tên sản phẩm (*)",
        "Loại hàng (*)",
        "Trọng lượng (kg) (*)",
        "Chiều dài (cm)",
        "Chiều rộng (cm)",
        "Chiều cao (cm)",
        "Số kiện (*)",
        "Tiền thu hộ COD (VND)",
        "Giá trị hàng hóa ( Phí khai giá)", // Lưu ý: Có dấu cách sau dấu ngoặc mở
        "Giao 1 phần",
        "Ghi chú"
    ];

    // Dòng 3: Số thứ tự cột
    const row3 = Array.from({ length: 19 }, (_, i) => (i + 1).toString());

    // --- 2. MAPPING DỮ LIỆU ---
    const dataRows = shipments.map((s, index) => {
        // Xử lý an toàn dữ liệu
        const productNames = s.products && Array.isArray(s.products)
            ? s.products.map(p => p.product_name).join(', ')
            : (s.product_name || 'Hàng hóa');

        const weightKg = parseFloat(((s.package_weight_g || 0) / 1000).toFixed(2));

        // Logic ép kiểu dữ liệu chuẩn J&T
        return [
            index + 1,                                      // 1. STT
            s.receiver_name || s.customer_name || '',       // 2. Tên
            s.receiver_phone || s.customer_phone || '',     // 3. SĐT
            s.receiver_address_detail || s.full_address || '', // 4. Địa chỉ
            s.order_number || s.order_id || '',             // 5. Mã đơn
            s.service_type || "Chuyển phát tiêu chuẩn",     // 6. Dịch vụ
            'Không',                                        // 7. Gửi tại bưu cục
            s.payment_method === 'cod' ? "Người nhận thanh toán" : "Người gửi thanh toán", // 8. PT TT
            productNames,                                   // 9. Tên SP
            'Hàng hóa',                                     // 10. Loại hàng
            weightKg > 0 ? weightKg : 0.2,                  // 11. Trọng lượng (Min 0.2kg để tránh lỗi)
            Number(s.package_length_cm || 0),               // 12. Dài
            Number(s.package_width_cm || 0),                // 13. Rộng
            Number(s.package_height_cm || 0),               // 14. Cao
            Number(s.package_count || 1),                   // 15. Số kiện
            Number(s.cod_amount || 0),                      // 16. COD
            Number(s.product_value || 0),                   // 17. Giá trị
            'Không',                                        // 18. Giao 1 phần
            s.note || ''                                    // 19. Ghi chú
        ];
    });

    // --- 3. TẠO WORKBOOK ---
    // Sử dụng aoa_to_sheet để tạo sheet từ mảng dữ liệu
    const ws = XLSX.utils.aoa_to_sheet([row1, row2, row3, ...dataRows]);

    // --- 4. CẤU HÌNH MERGE (GỘP Ô) - QUAN TRỌNG NHẤT ---
    // Nếu thiếu phần này, file sẽ bị coi là sai định dạng
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Gộp STT
        { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // Gộp Thông tin người nhận
        { s: { r: 0, c: 8 }, e: { r: 0, c: 17 } } // Gộp Hàng hóa
    ];

    // Cấu hình độ rộng cột cho dễ nhìn
    ws['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 45 }, { wch: 15 },
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();

    // --- 5. ĐẶT TÊN SHEET ---
    // BẮT BUỘC: Phải là "Danh sách Lên đơn"
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách Lên đơn");

    // --- 6. XUẤT FILE ---
    // Ép buộc bookType là xlsx để đảm bảo định dạng binary chuẩn
    const exportFileName = filename || `JnT_Import_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;

    XLSX.writeFile(wb, exportFileName, { bookType: 'xlsx', type: 'binary' });
};