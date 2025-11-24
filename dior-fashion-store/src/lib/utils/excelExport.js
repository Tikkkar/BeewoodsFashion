import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Export shipments to Excel
 */
export const exportShipmentsToExcel = (shipments, filename = null) => {
    if (!shipments || shipments.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
    }

    // Prepare data
    const data = shipments.map((s, index) => {
        // Get product codes and names from view (already aggregated)
        const productCodes = s.product_codes || '';
        const productNames = s.products ?
            (Array.isArray(s.products) ? s.products.map(p => p.product_name).join(', ') : '') : '';

        return {
            'STT': index + 1,
            'Mã đơn hàng': s.order_number || '',
            'Khách hàng': s.customer_name || '',
            'SĐT': s.customer_phone || '',
            'Địa chỉ': s.full_address || '',
            'Mã sản phẩm': productCodes,
            'Tên sản phẩm': productNames,
            'Mã vận đơn': s.tracking_number || 'Chưa có',
            'Nhà vận chuyển': s.carrier_code || '',
            'Trạng thái vận chuyển': getStatusLabel(s.shipment_status),
            'Trạng thái đơn': getOrderStatusLabel(s.order_status),
            'COD (VNĐ)': s.cod_amount || 0,
            'Trọng lượng (kg)': ((s.calculated_weight_g || 0) / 1000).toFixed(2),
            'Phí ship (VNĐ)': s.shipping_fee_actual || 0,
            'Ngày tạo': s.shipment_created_at ? format(new Date(s.shipment_created_at), 'dd/MM/yyyy HH:mm') : '',
            'Ghi chú': s.note_for_shipper || ''
        };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
        { wch: 5 },  // STT
        { wch: 15 }, // Mã đơn
        { wch: 20 }, // Khách hàng
        { wch: 12 }, // SĐT
        { wch: 50 }, // Địa chỉ
        { wch: 15 }, // Mã SP
        { wch: 35 }, // Tên SP
        { wch: 15 }, // Mã vận đơn
        { wch: 12 }, // Carrier
        { wch: 18 }, // Trạng thái VC
        { wch: 15 }, // Trạng thái đơn
        { wch: 12 }, // COD
        { wch: 12 }, // Trọng lượng
        { wch: 12 }, // Phí ship
        { wch: 18 }, // Ngày
        { wch: 30 }  // Ghi chú
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách vận chuyển');

    // Generate filename
    const defaultFilename = `shipments_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Download
    XLSX.writeFile(wb, finalFilename);
};

/**
 * Get status label in Vietnamese
 */
const getStatusLabel = (status) => {
    const labels = {
        'ready_to_pick': 'Chờ lấy hàng',
        'picking': 'Đang lấy hàng',
        'delivering': 'Đang giao',
        'delivered': 'Đã giao',
        'returned': 'Hoàn trả',
        'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
};

/**
 * Get order status label in Vietnamese
 */
const getOrderStatusLabel = (status) => {
    const labels = {
        'pending': 'Chờ xác nhận',
        'processing': 'Đang chuẩn bị',
        'shipping': 'Đang giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
};
