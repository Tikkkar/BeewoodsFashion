import { supabase } from '../supabase';

/**
 * Analytics API - Get statistics and data for charts
 */

// Get sales data by date range
export const getSalesAnalytics = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const salesByDate = {};
    data.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          revenue: 0,
          orders: 0,
          completed: 0,
          cancelled: 0
        };
      }
      
      salesByDate[date].orders += 1;
      if (order.status === 'completed') {
        salesByDate[date].revenue += order.total_amount;
        salesByDate[date].completed += 1;
      }
      if (order.status === 'cancelled') {
        salesByDate[date].cancelled += 1;
      }
    });

    return Object.values(salesByDate);
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw error;
  }
};

// Get top selling products
export const getTopProducts = async (limit = 10, startDate, endDate) => {
  try {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        product_id,
        product_name,
        product_image,
        orders!inner (
          created_at,
          status
        )
      `)
      .eq('orders.status', 'completed')
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (error) throw error;

    // Group by product
    const productStats = {};
    orderItems.forEach(item => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          id: productId,
          name: item.product_name,
          image: item.product_image,
          category: 'N/A', // We'll get this from products table if needed
          quantity: 0,
          revenue: 0
        };
      }
      
      productStats[productId].quantity += item.quantity;
      productStats[productId].revenue += item.price * item.quantity;
    });

    // Sort by quantity and limit
    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
};

// Get category performance - FIXED for many-to-many relationship
export const getCategoryPerformance = async (startDate, endDate) => {
  try {
    // Step 1: Get all order items
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        product_id,
        orders!inner (
          created_at,
          status
        )
      `)
      .eq('orders.status', 'completed')
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (error) throw error;
    if (!orderItems || orderItems.length === 0) return [];

    // Step 2: Get unique product IDs
    const productIds = [...new Set(orderItems.map(item => item.product_id))];

    // Step 3: Get product-category relationships from junction table
    const { data: productCategories, error: pcError } = await supabase
      .from('product_categories')
      .select('product_id, category_id')
      .in('product_id', productIds);

    if (pcError) throw pcError;

    // Step 4: Get category names
    const categoryIds = [...new Set(productCategories.map(pc => pc.category_id))];
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (catError) throw catError;

    // Step 5: Create mappings
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });

    const productToCategoriesMap = {};
    productCategories.forEach(pc => {
      if (!productToCategoriesMap[pc.product_id]) {
        productToCategoriesMap[pc.product_id] = [];
      }
      productToCategoriesMap[pc.product_id].push(pc.category_id);
    });

    // Step 6: Aggregate by category
    const categoryStats = {};
    
    orderItems.forEach(item => {
      const categoryIds = productToCategoriesMap[item.product_id] || [];
      
      categoryIds.forEach(categoryId => {
        const categoryName = categoryMap[categoryId];
        if (!categoryName) return;

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            id: categoryId,
            name: categoryName,
            quantity: 0,
            revenue: 0
          };
        }
        
        categoryStats[categoryId].quantity += item.quantity;
        categoryStats[categoryId].revenue += item.price * item.quantity;
      });
    });

    // Step 7: Convert to array and sort
    return Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue);
      
  } catch (error) {
    console.error('Error fetching category performance:', error);
    return []; // Return empty instead of throwing
  }
};

// Get order status distribution
export const getOrderStatusDistribution = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Count by status
    const statusCounts = {
      pending: 0,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0
    };

    data.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status] += 1;
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }));
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    throw error;
  }
};

// Get customer statistics
export const getCustomerStats = async (startDate, endDate) => {
  try {
    // Get orders with customer info
    const { data: orders, error } = await supabase
      .from('orders')
      .select('user_id, total_amount, status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Calculate stats
    const customerData = {};
    let newCustomers = 0;

    orders.forEach(order => {
      const customerId = order.user_id || 'guest';
      
      if (!customerData[customerId]) {
        customerData[customerId] = {
          orders: 0,
          revenue: 0,
          firstOrder: order.created_at
        };
        newCustomers += 1;
      }
      
      customerData[customerId].orders += 1;
      if (order.status === 'completed') {
        customerData[customerId].revenue += order.total_amount;
      }
    });

    const totalCustomers = Object.keys(customerData).length;
    const repeatingCustomers = Object.values(customerData).filter(c => c.orders > 1).length;
    const avgOrderValue = orders.length > 0 
      ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length 
      : 0;

    return {
      totalCustomers,
      newCustomers,
      repeatingCustomers,
      avgOrderValue,
      repeatRate: totalCustomers > 0 ? (repeatingCustomers / totalCustomers) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    throw error;
  }
};

// Get revenue by hour (for today)
export const getRevenueByHour = async (date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: 0,
      orders: 0
    }));

    data.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour].revenue += order.total_amount;
      hourlyData[hour].orders += 1;
    });

    return hourlyData;
  } catch (error) {
    console.error('Error fetching hourly revenue:', error);
    throw error;
  }
};

// Get comparison data (current vs previous period)
export const getComparisonData = async (currentStart, currentEnd, previousStart, previousEnd) => {
  try {
    // Current period
    const { data: currentOrders, error: currentError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', currentStart)
      .lte('created_at', currentEnd);

    if (currentError) throw currentError;

    // Previous period
    const { data: previousOrders, error: previousError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .gte('created_at', previousStart)
      .lte('created_at', previousEnd);

    if (previousError) throw previousError;

    // Calculate metrics
    const calculateMetrics = (orders) => {
      const revenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      return {
        revenue,
        orders: orders.length,
        completed: orders.filter(o => o.status === 'completed').length,
        avgOrderValue: orders.length > 0 ? revenue / orders.length : 0
      };
    };

    const current = calculateMetrics(currentOrders);
    const previous = calculateMetrics(previousOrders);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      growth: {
        revenue: calculateGrowth(current.revenue, previous.revenue),
        orders: calculateGrowth(current.orders, previous.orders),
        completed: calculateGrowth(current.completed, previous.completed),
        avgOrderValue: calculateGrowth(current.avgOrderValue, previous.avgOrderValue)
      }
    };
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    throw error;
  }
};