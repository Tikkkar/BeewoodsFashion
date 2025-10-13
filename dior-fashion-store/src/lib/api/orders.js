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
// CREATE ORDER (FIXED - Use total_amount)
// =============================================
export const createOrder = async (orderData) => {
  try {
    const { cartItems, customerInfo, shippingInfo, total_amount } = orderData;

    const shippingFee = 30000; // Fixed shipping fee
    const finalTotal = total_amount + shippingFee;

    // 1. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: null, // For guest checkout
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_district: shippingInfo.district,
        shipping_ward: shippingInfo.ward || '',
        subtotal: total_amount,
        shipping_fee: shippingFee,
        total_amount: finalTotal, // ✅ FIXED: Use total_amount
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
        notes: customerInfo.notes || null
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // 2. Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      size: item.selectedSize || 'One Size',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      throw itemsError;
    }

    // 3. Update product stock
    await updateProductStock(cartItems);

    console.log('✅ Order created successfully:', order.order_number);
    return { data: order, error: null };
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
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