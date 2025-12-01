import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const ShipmentFilters = ({ filters, onFilterChange, onReset }) => {

    // Hàm xử lý thay đổi giá trị chung
    const handleChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Bộ lọc tìm kiếm</h3>
                <button
                    onClick={onReset}
                    className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Đặt lại
                </button>
            </div>

            <div className="space-y-4">
                {/* Dòng 1: Các bộ lọc trạng thái và Nhà vận chuyển */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Trạng thái vận chuyển */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Trạng thái vận chuyển
                        </label>
                        <select
                            value={filters.shipment_status || ''}
                            onChange={(e) => handleChange('shipment_status', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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

                    {/* Trạng thái đơn hàng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Trạng thái đơn hàng
                        </label>
                        <select
                            value={filters.order_status || ''}
                            onChange={(e) => handleChange('order_status', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="processing">Đang chuẩn bị</option>
                            <option value="shipping">Đang giao</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    {/* Nhà vận chuyển */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nhà vận chuyển
                        </label>
                        <select
                            value={filters.carrier_code || ''}
                            onChange={(e) => handleChange('carrier_code', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">Tất cả</option>
                            <option value="J&T">J&T Express</option>
                            <option value="GHN">Giao Hàng Nhanh</option>
                            <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                            <option value="VIETTEL">Viettel Post</option>
                        </select>
                    </div>

                    {/* Mã sản phẩm */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Mã sản phẩm
                        </label>
                        <input
                            type="text"
                            value={filters.product_code || ''}
                            onChange={(e) => handleChange('product_code', e.target.value)}
                            placeholder="VD: SP001..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Dòng 2: Thời gian và Tìm kiếm */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Từ ngày */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Đến ngày */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Tìm kiếm chung (Chiếm 2 cột trên màn hình lớn) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => handleChange('search', e.target.value)}
                                placeholder="Mã đơn, Mã vận đơn, Tên khách hàng, SĐT..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShipmentFilters;