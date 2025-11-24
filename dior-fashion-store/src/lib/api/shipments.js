import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * Get shipments with filters - Using v_shipments_full view
 */
export const getShipments = async (filters = {}) => {
    try {
        // Use view for better performance and complete data
        let query = supabase
            .from('v_shipments_full')
            .select('*')
            .order('shipment_created_at', { ascending: false });

        // Filter by shipment status
        if (filters.shipment_status) {
            query = query.eq('shipment_status', filters.shipment_status);
        }

        // Filter by order status
        if (filters.order_status) {
            query = query.eq('order_status', filters.order_status);
        }

        // Filter by carrier
        if (filters.carrier_code) {
            query = query.eq('carrier_code', filters.carrier_code);
        }

        // Date range
        if (filters.date_from) {
            query = query.gte('shipment_created_at', filters.date_from);
        }
        if (filters.date_to) {
            query = query.lte('shipment_created_at', filters.date_to + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) throw error;

        // Client-side filter for product_code and search
        let filteredData = data;

        if (filters.product_code) {
            filteredData = filteredData.filter(shipment =>
                shipment.product_codes?.toLowerCase().includes(filters.product_code.toLowerCase())
            );
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredData = filteredData.filter(shipment =>
                shipment.tracking_number?.toLowerCase().includes(searchLower) ||
                shipment.order_number?.toLowerCase().includes(searchLower) ||
                shipment.customer_name?.toLowerCase().includes(searchLower) ||
                shipment.customer_phone?.includes(filters.search)
            );
        }

        return { data: filteredData, error: null };
    } catch (error) {
        console.error('Error fetching shipments:', error);
        toast.error('Không thể tải danh sách vận chuyển');
        return { data: null, error };
    }
};

/**
 * Get shipment by ID - Using v_shipments_full view
 */
export const getShipmentById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('v_shipments_full')
            .select('*')
            .eq('shipment_id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching shipment:', error);
        toast.error('Không thể tải thông tin vận chuyển');
        return { data: null, error };
    }
};

/**
 * Update shipment
 */
export const updateShipment = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        toast.success('Cập nhật thành công!');
        return { data, error: null };
    } catch (error) {
        console.error('Error updating shipment:', error);
        toast.error('Cập nhật thất bại: ' + error.message);
        return { data: null, error };
    }
};

/**
 * Bulk update shipment status
 */
export const bulkUpdateShipmentStatus = async (ids, newStatus) => {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .update({ status: newStatus })
            .in('id', ids)
            .select();

        if (error) throw error;
        toast.success(`Đã cập nhật ${data.length} vận đơn!`);
        return { data, error: null };
    } catch (error) {
        console.error('Error bulk updating shipments:', error);
        toast.error('Cập nhật thất bại: ' + error.message);
        return { data: null, error };
    }
};

/**
 * Get shipment statistics
 */
export const getShipmentStats = async () => {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .select('status');

        if (error) throw error;

        const stats = {
            total: data.length,
            ready_to_pick: data.filter(s => s.status === 'ready_to_pick').length,
            picking: data.filter(s => s.status === 'picking').length,
            delivering: data.filter(s => s.status === 'delivering').length,
            delivered: data.filter(s => s.status === 'delivered').length,
            returned: data.filter(s => s.status === 'returned').length,
            cancelled: data.filter(s => s.status === 'cancelled').length,
        };

        return { data: stats, error: null };
    } catch (error) {
        console.error('Error fetching shipment stats:', error);
        return { data: null, error };
    }
};
