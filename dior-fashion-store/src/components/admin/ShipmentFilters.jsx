import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const ShipmentFilters = ({ filters, onFilterChange, onReset }) => {
    const handleChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>

            {/* Row 1: Status filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Shipment Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái vận chuyển
                    </label>
                    <select
                        value={filters.shipment_status || ''}
                        onChange={(e) => handleChange('shipment_status', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="ready_to_pick">Chờ lấy hàng</option>
                        <option value="picking">Đang lấy hàng</option>
                        <option value="delivering">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="returned">Hoàn trả</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                {/* Order Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái đơn hàng
                    </label>
                    <select
                        value={filters.order_status || ''}
                        onChange={(e) => handleChange('order_status', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang chuẩn bị</option>
                        <option value="shipping">Đang giao</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                {/* Carrier */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhà vận chuyển
                    </label>
                    <select
                        value={filters.carrier_code || ''}
                        onChange={(e) => handleChange('carrier_code', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="J&T">J&T Express</option>
                        <option value="GHN">Giao Hàng Nhanh</option>
                        <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                        <option value="VIETTEL">Viettel Post</option>
                    </select>
                </div>

                {/* Product Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã sản phẩm
                    </label>
                    <input
                        type="text"
                        value={filters.product_code || ''}
                        onChange={(e) => handleChange('product_code', e.target.value)}
                        placeholder="VD: SP001, DIOR-TS-001"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>
            </div>

            {/* Row 2: Date and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date From */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => handleChange('date_from', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => handleChange('date_to', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tìm kiếm
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                            placeholder="Mã đơn, Mã vận đơn, Tên khách hàng, SĐT..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Đặt lại bộ lọc
                </button>
            </div>
        </div>
    );
};

export default ShipmentFilters;
