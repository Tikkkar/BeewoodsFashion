import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck,
    Package,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    Loader2
} from 'lucide-react';
import { getShipments, getShipmentStats, bulkUpdateShipmentStatus } from '../../lib/api/shipments';
import { exportShipmentsToExcel } from '../../lib/utils/excelExport';
import ShipmentFilters from '../../components/admin/ShipmentFilters';
import ShipmentEditModal from '../../components/admin/ShipmentEditModal';
import { format } from 'date-fns';

const AdminShipments = () => {
    const [shipments, setShipments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [editingShipment, setEditingShipment] = useState(null);

    const [filters, setFilters] = useState({
        shipment_status: '',
        order_status: '',
        carrier_code: '',
        product_code: '',
        date_from: '',
        date_to: '',
        search: ''
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        const [shipmentsResult, statsResult] = await Promise.all([
            getShipments(filters),
            getShipmentStats()
        ]);

        if (shipmentsResult.data) setShipments(shipmentsResult.data);
        if (statsResult.data) setStats(statsResult.data);
        setLoading(false);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setSelectedIds([]);
    };

    const handleResetFilters = () => {
        setFilters({
            shipment_status: '',
            order_status: '',
            carrier_code: '',
            product_code: '',
            date_from: '',
            date_to: '',
            search: ''
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(shipments.map(s => s.shipment_id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkUpdateStatus = async (newStatus) => {
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất một vận đơn');
            return;
        }

        if (!window.confirm(`Cập nhật ${selectedIds.length} vận đơn sang trạng thái "${getStatusLabel(newStatus)}"?`)) {
            return;
        }

        await bulkUpdateShipmentStatus(selectedIds, newStatus);
        setSelectedIds([]);
        loadData();
    };

    const handleExportAll = () => {
        exportShipmentsToExcel(shipments);
    };

    const handleExportSelected = () => {
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất một vận đơn');
            return;
        }
        const selectedShipments = shipments.filter(s => selectedIds.includes(s.shipment_id));
        exportShipmentsToExcel(selectedShipments, `shipments_selected_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'ready_to_pick': 'bg-yellow-100 text-yellow-800',
            'picking': 'bg-blue-100 text-blue-800',
            'delivering': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'returned': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'ready_to_pick': 'Chờ lấy hàng',
            'picking': 'Đang lấy hàng',
            'delivering': 'Đang giao',
            'delivered': 'Đã giao',
            'returned': 'Hoàn trả',
            'cancelled': 'Đã hủy'
        };
        return labels[status] || status;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Vận chuyển</h1>
                    <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả vận đơn</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Tổng cộng</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <Package className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Chờ lấy</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.ready_to_pick}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Đang giao</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.delivering}</p>
                                </div>
                                <Truck className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Đã giao</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <ShipmentFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 flex items-center justify-between">
                        <span className="text-blue-800 font-medium">
                            Đã chọn {selectedIds.length} vận đơn
                        </span>
                        <div className="flex gap-2">
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleBulkUpdateStatus(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                className="border border-blue-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Cập nhật trạng thái</option>
                                <option value="ready_to_pick">Chờ lấy hàng</option>
                                <option value="picking">Đang lấy hàng</option>
                                <option value="delivering">Đang giao</option>
                                <option value="delivered">Đã giao</option>
                                <option value="returned">Hoàn trả</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                            <button
                                onClick={handleExportSelected}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Xuất Excel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm mt-6 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">
                            Danh sách vận đơn ({shipments.length})
                        </h2>
                        <button
                            onClick={handleExportAll}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Xuất tất cả
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="text-center p-12 text-gray-500">
                            Không có vận đơn nào
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === shipments.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã đơn</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Khách hàng</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã vận đơn</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Carrier</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">COD</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trọng lượng</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày tạo</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {shipments.map((shipment) => (
                                        <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(shipment.shipment_id)}
                                                    onChange={() => handleSelectOne(shipment.shipment_id)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    to={`/admin/orders/${shipment.order_id}`}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    {shipment.order_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{shipment.customer_name}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="text-xs text-gray-600 font-mono">
                                                    {shipment.product_codes || <span className="text-gray-400">-</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono">
                                                {shipment.tracking_number || <span className="text-gray-400">Chưa có</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{shipment.carrier_code}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(shipment.shipment_status)}`}>
                                                    {getStatusLabel(shipment.shipment_status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{formatPrice(shipment.cod_amount || 0)}</td>
                                            <td className="px-4 py-3 text-sm">{((shipment.calculated_weight_g || 0) / 1000).toFixed(2)} kg</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {shipment.shipment_created_at ? format(new Date(shipment.shipment_created_at), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingShipment(shipment)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <Link
                                                        to={`/admin/orders/${shipment.order_id}`}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        title="Xem đơn hàng"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingShipment && (
                <ShipmentEditModal
                    shipment={editingShipment}
                    onClose={() => setEditingShipment(null)}
                    onSuccess={() => {
                        loadData();
                        setEditingShipment(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminShipments;
