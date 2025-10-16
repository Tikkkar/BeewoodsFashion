import { supabase } from '../supabase';

// =============================================
// UPDATE PRODUCT STOCK AFTER ORDER
// =============================================
const updateProductStock = async (cartItems) => {
  try {
    for (const item of cartItems) {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single();

      if (fetchError) throw fetchError;

      // Update stock
      const newStock = product.stock - item.quantity;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: Math.max(0, newStock) })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Update size stock if applicable
      if (item.selectedSize && item.selectedSize !== 'One Size') {
        const { data: sizeData, error: sizeError } = await supabase
          .from('product_sizes')
          .select('stock')
          .eq('product_id', item.id)
          .eq('size', item.selectedSize)
          .single();

        if (!sizeError && sizeData) {
          await supabase
            .from('product_sizes')
            .update({ stock: Math.max(0, sizeData.stock - item.quantity) })
            .eq('product_id', item.id)
            .eq('size', item.selectedSize);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating stock:', error);
    return { success: false, error };
  }
};

// =============================================
// CREATE ORDER (Đã cập nhật để xử lý giảm giá)
// =============================================
export const createOrder = async (orderData) => {
 try {
    // ✨ THAY ĐỔI: Thêm `discountInfo` vào destructuring
    const { cartItems, customerInfo, shippingInfo, discountInfo } = orderData;

    // 1. Tính toán lại các giá trị tổng để đảm bảo chính xác
    const originalSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = 30000; // Phí vận chuyển cố định
    
    // ✨ THAY ĐỔI: Lấy thông tin giảm giá từ discountInfo
    const appliedDiscountCode = discountInfo?.code || null;
    const discountAmount = discountInfo?.discountAmount || 0;
    
    const totalAfterDiscount = originalSubtotal - discountAmount;
    const finalTotal = totalAfterDiscount + shippingFee;

    // 2. Tạo đối tượng payload để chèn vào DB
    const orderPayload = {
        user_id: customerInfo.userId || null, // Hỗ trợ cả guest và user đã đăng nhập
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_district: shippingInfo.district,
        shipping_ward: shippingInfo.ward || '',
        notes: customerInfo.notes || null,
        
        // ✨ THAY ĐỔI: Cập nhật các trường về tiền tệ
        subtotal: originalSubtotal,          // Tổng tiền gốc của sản phẩm
        discount_amount: discountAmount,       // Số tiền được giảm
        applied_discount_code: appliedDiscountCode, // Mã giảm giá đã áp dụng
        shipping_fee: shippingFee,             // Phí vận chuyển
        total_amount: finalTotal,              // Tổng tiền cuối cùng khách phải trả

        status: 'pending',
        payment_method: 'cod',
        payment_status: 'pending',
    };

    // 3. Chèn đơn hàng vào bảng 'orders'
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

    if (orderError) {
        console.error('Lỗi khi tạo đơn hàng:', orderError);
        throw orderError;
    }

    // 4. Chèn các sản phẩm của đơn hàng vào 'order_items'
    const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.imagePrimary,
        size: item.selectedSize || 'One Size',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Lỗi khi tạo chi tiết đơn hàng:', itemsError);
        // Cân nhắc xóa đơn hàng vừa tạo để tránh rác DB
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
    }

    // 5. Cập nhật số lượng tồn kho
    await updateProductStock(cartItems);

    console.log('✅ Đã tạo đơn hàng thành công:', order.order_number);
    return { data: order, error: null };
    
 } catch (error) {
    console.error('❌ Lỗi nghiêm trọng khi tạo đơn hàng:', error);
    return { data: null, error: error.message };
 }
};

// =============================================
// GET ORDER BY ID
// =============================================
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// GET ORDER BY ORDER NUMBER
// =============================================
export const getOrderByNumber = async (orderNumber) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { data: null, error: error.message };
  }
};

// =============================================
// GET USER ORDERS (for authenticated users)
// =============================================
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { data: null, error: error.message };
  }
};