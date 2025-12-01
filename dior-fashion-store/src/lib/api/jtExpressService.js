// src/lib/api/jtExpressService.js
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { format } from 'date-fns';

// ===== CẤU HÌNH J&T EXPRESS =====
const JT_CONFIG = {
    // URL API
    API_URL: 'https://api.jtexpress.vn/webopenplatformapi/api/order/addOrder', // Production
    // API_URL: 'https://demoopenapi.jtexpress.vn/webopenplatformapi/api/order/addOrder', // Demo/Test

    // Thông tin tài khoản (lấy từ J&T Open Platform)
    API_ACCOUNT: import.meta.env.VITE_JT_API_ACCOUNT || '178337126125932605',
    PRIVATE_KEY: import.meta.env.VITE_JT_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE',

    // Thông tin khách hàng
    CUSTOMER_CODE: import.meta.env.VITE_JT_CUSTOMER_CODE || 'LC00001114',
    CUSTOMER_KEY: import.meta.env.VITE_JT_CUSTOMER_KEY || 'YOUR_CUSTOMER_KEY_HERE',

    // Hậu tố chuẩn của J&T
    PASSWORD_SUFFIX: 'jadada369t3',

    // Thông tin người gửi mặc định
    SENDER: {
        name: "KHO BYE BÉO BMT - JT",
        phone: "0905054057",
        mobile: "0905054057",
        prov: "Đắk Lắk",
        city: "Thành phố Buôn Ma Thuột",
        area: "Phường Tân Hoà",
        address: "267/22 MAI HẮC ĐẾ"
    }
};

/**
 * Tạo Password cho bizContent (Body)
 * Công thức: MD5(CustomerKey + "jadada369t3") -> 32 ký tự IN HOA
 */
const generatePassword = (customerKey) => {
    const raw = customerKey + JT_CONFIG.PASSWORD_SUFFIX;
    const hash = CryptoJS.MD5(raw).toString();
    return hash.toUpperCase(); // QUAN TRỌNG: Phải viết HOA
};

/**
 * Tạo chữ ký Digest cho Header
 * Công thức: Base64(MD5(bizContentString + privateKey))
 */
const generateDigest = (bizContentString, privateKey) => {
    const raw = bizContentString + privateKey;
    const hash = CryptoJS.MD5(raw);
    return CryptoJS.enc.Base64.stringify(hash);
};

/**
 * Chuẩn hóa số điện thoại (loại bỏ +84, 84, thay bằng 0)
 */
const normalizePhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
    if (cleaned.startsWith('84')) cleaned = '0' + cleaned.substring(2);
    if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.substring(3);
    return cleaned;
};

/**
 * Tạo đơn hàng J&T Express
 * @param {Object} shipmentData - Dữ liệu từ database shipments table
 * @returns {Promise<Object>} - Kết quả từ J&T API
 */
export const createJTOrder = async (shipmentData) => {
    try {
        console.log('📦 [J&T] Đang tạo đơn hàng:', shipmentData.order_number);

        // 1. Validate dữ liệu đầu vào
        if (!shipmentData.receiver_name || !shipmentData.receiver_phone) {
            throw new Error('Thiếu thông tin người nhận');
        }

        // 2. Tạo password
        const password = generatePassword(JT_CONFIG.CUSTOMER_KEY);

        // 3. Chuẩn bị bizContent
        const bizContent = {
            customerCode: JT_CONFIG.CUSTOMER_CODE,
            password: password,

            // Mã đơn hàng của bạn (unique)
            txlogisticId: shipmentData.order_number || `ORDER_${Date.now()}`,

            // Loại đơn: 1 = Thông thường, 2 = COD
            orderType: shipmentData.cod_amount > 0 ? 2 : 1,

            // Loại dịch vụ: 1 = Express (Nhanh)
            serviceType: 1,

            // Thông tin người gửi
            sender: JT_CONFIG.SENDER,

            // Thông tin người nhận
            receiver: {
                name: shipmentData.receiver_name,
                phone: normalizePhone(shipmentData.receiver_phone),
                mobile: normalizePhone(shipmentData.receiver_phone),
                prov: shipmentData.shipping_city || 'TP. Hồ Chí Minh',
                city: shipmentData.shipping_district || 'Quận 1',
                area: shipmentData.shipping_ward || 'Phường 1',
                address: shipmentData.receiver_address_detail || shipmentData.shipping_address
            },

            // Thời gian tạo đơn
            createOrderTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),

            // Phương thức thanh toán
            // PP_PM = Người gửi trả, PP_CASH = Người nhận trả (COD)
            payType: shipmentData.payment_method === 'cod' ? 'PP_CASH' : 'PP_PM',

            // Giá trị hàng hóa (để tính phí bảo hiểm)
            itemsValue: shipmentData.product_value || shipmentData.cod_amount || 0,
            goodsValue: shipmentData.product_value || shipmentData.cod_amount || 0,

            // Danh sách hàng hóa
            items: [{
                itemName: shipmentData.items_summary || shipmentData.product_names || 'Hàng thời trang',
                number: 1,
                itemValue: shipmentData.product_value || 0
            }],

            // Trọng lượng (kg)
            weight: ((shipmentData.total_weight_g || shipmentData.package_weight_g || 500) / 1000).toFixed(2).toString(),

            // Ghi chú
            remark: shipmentData.note_for_shipper || shipmentData.note || 'Cho xem hàng, không thử',

            // Loại sản phẩm
            productType: 'EXPRESS',

            // Số tiền thu hộ COD
            codMoney: parseFloat(shipmentData.cod_amount || 0)
        };

        // 4. Chuyển thành JSON string
        const bizContentString = JSON.stringify(bizContent);

        console.log('📋 [J&T] bizContent:', bizContent);

        // 5. Tạo digest cho header
        const digest = generateDigest(bizContentString, JT_CONFIG.PRIVATE_KEY);
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

        // 6. Gửi request
        const response = await axios.post(
            JT_CONFIG.API_URL,
            `bizContent=${encodeURIComponent(bizContentString)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    'apiAccount': JT_CONFIG.API_ACCOUNT,
                    'digest': digest,
                    'timestamp': timestamp
                },
                timeout: 30000 // 30 giây
            }
        );

        console.log('✅ [J&T] Response:', response.data);

        // 7. Xử lý kết quả
        const result = response.data;

        // J&T trả về code = "1" hoặc success = true là thành công
        if (result.code === '1' || result.code === 1 || result.success === true) {
            return {
                success: true,
                tracking_number: result.data?.billCode || result.data?.txlogisticId,
                data: result.data,
                message: 'Tạo vận đơn J&T thành công'
            };
        } else {
            console.error('❌ [J&T] Error:', result);
            return {
                success: false,
                error: result.msg || result.reason || result.message || 'Lỗi không xác định',
                data: result
            };
        }

    } catch (error) {
        console.error('❌ [J&T] Exception:', error);

        // Xử lý lỗi chi tiết
        if (error.response) {
            return {
                success: false,
                error: error.response.data?.msg || error.response.data?.message || 'Lỗi từ J&T API',
                data: error.response.data
            };
        } else if (error.request) {
            return {
                success: false,
                error: 'Không thể kết nối đến J&T API. Vui lòng kiểm tra mạng.',
                data: null
            };
        } else {
            return {
                success: false,
                error: error.message || 'Lỗi không xác định',
                data: null
            };
        }
    }
};

/**
 * Truy vấn thông tin vận đơn từ J&T
 * @param {string} billCode - Mã vận đơn J&T
 * @returns {Promise<Object>}
 */
export const trackJTOrder = async (billCode) => {
    try {
        const password = generatePassword(JT_CONFIG.CUSTOMER_KEY);

        const bizContent = {
            customerCode: JT_CONFIG.CUSTOMER_CODE,
            password: password,
            billCode: billCode
        };

        const bizContentString = JSON.stringify(bizContent);
        const digest = generateDigest(bizContentString, JT_CONFIG.PRIVATE_KEY);
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

        const response = await axios.post(
            'https://api.jtexpress.vn/webopenplatformapi/api/order/track',
            `bizContent=${encodeURIComponent(bizContentString)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    'apiAccount': JT_CONFIG.API_ACCOUNT,
                    'digest': digest,
                    'timestamp': timestamp
                }
            }
        );

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ [J&T] Track error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};