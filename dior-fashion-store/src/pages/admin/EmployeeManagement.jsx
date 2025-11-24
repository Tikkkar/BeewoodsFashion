import React, { useState, useEffect } from 'react';
import { getEmployees, getEmployeeStats, createEmployee, updateEmployee, deactivateEmployee } from '../../lib/api/employees';
import { useRBAC } from '../../hooks/useRBAC';
import { Plus, Edit, UserX, TrendingUp, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeFormModal from '../../components/admin/EmployeeFormModal';

const EmployeeManagement = () => {
    const { canManageEmployees, getRoleDisplayName, getRoleBadgeColor } = useRBAC();
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        is_active: true,
        search: ''
    });

    useEffect(() => {
        if (!canManageEmployees) {
            toast.error('Bạn không có quyền truy cập trang này');
            return;
        }
        loadEmployees();
    }, [filters, canManageEmployees]);

    const loadEmployees = async () => {
        setLoading(true);
        const { data } = await getEmployees(filters);
        if (data) {
            setEmployees(data);
            // Load stats for each employee
            loadEmployeeStats();
        }
        setLoading(false);
    };

    const loadEmployeeStats = async () => {
        const { data } = await getEmployeeStats();
        if (data) {
            setStats(data);
        }
    };

    const handleCreateEmployee = async (employeeData) => {
        const { data, error } = await createEmployee(employeeData);
        if (!error) {
            setShowAddModal(false);
            loadEmployees();
        }
    };

    const handleUpdateEmployee = async (employeeId, updates) => {
        const { data, error } = await updateEmployee(employeeId, updates);
        if (!error) {
            setEditingEmployee(null);
            loadEmployees();
        }
    };

    const handleDeactivate = async (employeeId) => {
        if (window.confirm('Bạn có chắc muốn vô hiệu hóa nhân viên này?')) {
            await deactivateEmployee(employeeId);
            loadEmployees();
        }
    };

    const getEmployeeStats = (employeeId) => {
        return stats.find(s => s.employee_id === employeeId) || {};
    };

    if (!canManageEmployees) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h2>
                <p className="text-gray-600 mt-2">Bạn không có quyền quản lý nhân viên</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
                    <p className="text-gray-600 mt-1">Quản lý nhân viên Sale và Warehouse</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                >
                    <Plus className="w-5 h-5" />
                    Thêm nhân viên
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vai trò
                        </label>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            <option value="">Tất cả</option>
                            <option value="sale">Sale</option>
                            <option value="warehouse">Warehouse</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            value={filters.is_active}
                            onChange={(e) => setFilters({ ...filters, is_active: e.target.value === 'true' })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            <option value="true">Đang hoạt động</option>
                            <option value="false">Đã vô hiệu hóa</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Tên, email, mã NV..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Employee List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Nhân viên
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Vai trò
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Mã NV
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Đơn hàng (30 ngày)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Doanh thu (30 ngày)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    Không có nhân viên nào
                                </td>
                            </tr>
                        ) : (
                            employees.map((employee) => {
                                const empStats = getEmployeeStats(employee.id);
                                return (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{employee.full_name}</div>
                                                <div className="text-sm text-gray-500">{employee.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                                                {getRoleDisplayName(employee.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {employee.employee_code || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {empStats.orders_30d || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {(empStats.revenue_30d || 0).toLocaleString('vi-VN')}₫
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${employee.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {employee.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingEmployee(employee)}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </button>
                                                {employee.is_active && (
                                                    <button
                                                        onClick={() => handleDeactivate(employee.id)}
                                                        className="p-2 hover:bg-gray-100 rounded"
                                                        title="Vô hiệu hóa"
                                                    >
                                                        <UserX className="w-4 h-4 text-red-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <EmployeeFormModal
                isOpen={showAddModal || !!editingEmployee}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                }}
                onSubmit={editingEmployee ?
                    (data) => handleUpdateEmployee(editingEmployee.id, data) :
                    handleCreateEmployee
                }
                employee={editingEmployee}
            />
        </div>
    );
};

export default EmployeeManagement;
