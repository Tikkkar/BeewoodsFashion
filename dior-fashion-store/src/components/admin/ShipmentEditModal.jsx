import React, { useState } from 'react';
import { X, User, Truck, DollarSign, FileText, Save } from 'lucide-react';
import { updateShipment } from '../../lib/api/shipments'; // Đảm bảo bạn đã có hàm này trong API
// Nếu chưa có hàm updateShipment, xem phần dưới cùng câu trả lời này

const ShipmentEditModal = ({ shipment, onClose, onSuccess }) => {
    // Gộp state của cả 2 phiên bản
    const [formData, setFormData] = useState({
        // 1. Thông tin người nhận
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        receiver_address_detail: shipment.receiver_address_detail || '',

        // 2. Thông tin vận chuyển
        tracking_number: shipment.tracking_number || '', // Mã vận đơn
        shipment_status: shipment.shipment_status || 'ready_to_pick', // Trạng thái

        // 3. Tài chính
        cod_amount: shipment.cod_amount || 0,
        shipping_fee_actual: shipment.shipping_fee_actual || 0,

        // 4. Khác
        note: shipment.note || '' // Ghi chú
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cod_amount' || name === 'shipping_fee_actual'
                ? parseFloat(value) || 0
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Gọi API update (Thay vì gọi trực tiếp Supabase ở đây để code sạch hơn)
            await updateShipment(shipment.shipment_id, formData);

            // Thông báo thành công
            alert('Cập nhật vận đơn thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating shipment:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">

                {/* --- Header --- */}
                <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa vận đơn</h2>
                        <p className="text-sm text-gray-500">Mã đơn: <span className="font-mono font-medium text-blue-600">{shipment.order_number}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Body --- */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Nhóm 1: Thông tin người nhận */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                            <User className="w-4 h-4 mr-2" /> Thông tin người nhận
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tên người nhận</label>
                                <input
                                    type="text"
                                    name="receiver_name"
                                    value={formData.receiver_name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    name="receiver_phone"
                                    value={formData.receiver_phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Địa chỉ chi tiết</label>
                                <input
                                    type="text"
                                    name="receiver_address_detail"
                                    value={formData.receiver_address_detail}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nhóm 2: Vận chuyển & Trạng thái */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="flex items-center text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wider">
                            <Truck className="w-4 h-4 mr-2" /> Vận chuyển
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-blue-700 mb-1">Mã vận đơn (Tracking No)</label>
                                <input
                                    type="text"
                                    name="tracking_number"
                                    value={formData.tracking_number}
                                    onChange={handleChange}
                                    placeholder="Chưa có mã"
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-blue-700 mb-1">Trạng thái hiện tại</label>
                                <select
                                    name="shipment_status"
                                    value={formData.shipment_status}
                                    onChange={handleChange}
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="ready_to_pick">Chờ lấy hàng</option>
                                    <option value="picking">Đang lấy hàng</option>
                                    <option value="delivering">Đang giao</option>
                                    <option value="delivered">Đã giao</option>
                                    <option value="returned">Hoàn trả</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Nhóm 3: Tài chính & Ghi chú */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tài chính */}
                        <div>
                            <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                                <DollarSign className="w-4 h-4 mr-2" /> Tài chính
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiền thu hộ (COD)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="cod_amount"
                                            value={formData.cod_amount}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-500 font-bold">VND</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phí ship thực tế</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="shipping_fee_actual"
                                            value={formData.shipping_fee_actual}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-gray-500 font-bold">VND</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                                <FileText className="w-4 h-4 mr-2" /> Ghi chú
                            </h3>
                            <div className="h-full">
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="Ghi chú nội bộ hoặc cho shipper..."
                                    className="w-full h-[124px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                            {loading ? (
                                'Đang lưu...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShipmentEditModal;