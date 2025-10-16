import supabase from '../supabase';

/**
 * Xác thực mã giảm giá từ database.
 * @param {string} code - Mã giảm giá do người dùng nhập.
 * @returns {Promise<object|null>} Trả về đối tượng mã giảm giá nếu hợp lệ, ngược lại trả về null.
 */
export const verifyDiscountCode = async (code) => {
  if (!code) return null;

  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase()) // So sánh mãแบบ không phân biệt hoa thường
      .eq('is_active', true)
      .single();

    // Nếu có lỗi hoặc không tìm thấy mã
    if (error || !data) {
      console.error('Không tìm thấy mã giảm giá hoặc có lỗi:', error?.message);
      return null;
    }

    // Kiểm tra xem mã đã hết hạn chưa
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      console.log(`Mã "${code}" đã hết hạn.`);
      return null;
    }

    // Nếu tất cả điều kiện đều đạt, trả về thông tin mã
    return data;

  } catch (err) {
    console.error('Lỗi không xác định khi xác thực mã:', err);
    return null;
  }
};