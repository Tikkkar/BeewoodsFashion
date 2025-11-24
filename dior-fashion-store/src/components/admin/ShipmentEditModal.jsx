import React, { useState } from 'react';
import { X } from 'lucide-react';
import { updateShipment } from '../../lib/api/shipments';

const ShipmentEditModal = ({ shipment, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        tracking_number: shipment.tracking_number || '',
        status: shipment.shipment_status || 'ready_to_pick',
        note_for_shipper: shipment.note_for_shipper || '',
        shipping_fee_actual: shipment.shipping_fee_actual || 0
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateShipment(shipment.shipment_id, formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating shipment:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">Chỉnh sửa vận đơn</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Order Info (Read-only) */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="ml-2 font-medium">{shipment.order_number}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Khách hàng:</span>
                                <span className="ml-2 font-medium">{shipment.customer_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Nhà vận chuyển:</span>
                                <span className="ml-2 font-medium">{shipment.carrier_code}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">COD:</span>
                                <span className="ml-2 font-medium">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipment.cod_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã vận đơn
                        </label>
                        <input
                            type="text"
                            name="tracking_number"
                            value={formData.tracking_number}
                            onChange={handleChange}
                            placeholder="Nhập mã vận đơn từ J&T/GHN/..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                            <option value="ready_to_pick">Chờ lấy hàng</option>
                            <option value="picking">Đang lấy hàng</option>
                            <option value="delivering">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="returned">Hoàn trả</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    {/* Shipping Fee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phí vận chuyển thực tế (VNĐ)
                        </label>
                        <input
                            type="number"
                            name="shipping_fee_actual"
                            value={formData.shipping_fee_actual}
                            onChange={handleChange}
                            min="0"
                            step="1000"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú cho shipper
                        </label>
                        <textarea
                            name="note_for_shipper"
                            value={formData.note_for_shipper}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ghi chú đặc biệt cho shipper..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShipmentEditModal;
