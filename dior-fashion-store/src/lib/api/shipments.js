import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

/**
 * Get shipments with filters - Direct query from shipments table
 */
export const getShipments = async (filters = {}) => {
    try {
        let query = supabase
            .from('shipments')
            .select(`
                *,
                orders:order_id (
                    order_number,
                    customer_name,
                    customer_phone,
                    status,
                    total_amount
                )
            `)
            .order('created_at', { ascending: false });

        // Loại bỏ filter orders.status vì không thể filter nested relation
        if (filters.shipment_status) {
            query = query.eq('status', filters.shipment_status);
        }

        if (filters.carrier_code) {
            query = query.eq('carrier_code', filters.carrier_code);
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Shipments query error:', error);
            throw error;
        }

        // Transform và filter
        const transformedData = (data || []).map(shipment => ({
            ...shipment,
            order_number: shipment.orders?.order_number,
            customer_name: shipment.orders?.customer_name,
            customer_phone: shipment.orders?.customer_phone,
            order_status: shipment.orders?.status,
            total_amount: shipment.orders?.total_amount
        }));

        let filteredData = transformedData;

        // Client-side filters
        if (filters.order_status) {
            filteredData = filteredData.filter(s => s.order_status === filters.order_status);
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
        console.error('❌ Error fetching shipments:', error);
        toast.error('Không thể tải danh sách vận chuyển: ' + error.message);
        return { data: [], error };
    }
};

/**
 * Get shipment by ID - Direct query from shipments table
 */
export const getShipmentById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .select(`
                *,
                orders!inner (
                    order_number,
                    customer_name,
                    customer_phone,
                    status,
                    total_amount
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Transform data
        const transformed = {
            ...data,
            order_number: data.orders?.order_number,
            customer_name: data.orders?.customer_name,
            customer_phone: data.orders?.customer_phone,
            order_status: data.orders?.status,
            total_amount: data.orders?.total_amount
        };

        return { data: transformed, error: null };
    } catch (error) {
        console.error('❌ Error fetching shipment:', error);
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
