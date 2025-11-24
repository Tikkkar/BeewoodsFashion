import React, { useState } from 'react';
import { X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { validatePasswordStrength, generateStrongPassword } from '../../lib/utils/passwordUtils';

const EmployeeFormModal = ({ isOpen, onClose, onSubmit, employee = null }) => {
    const isEditing = !!employee;

    const [formData, setFormData] = useState({
        email: employee?.email || '',
        password: '',
        full_name: employee?.full_name || '',
        phone: employee?.phone || '',
        role: employee?.role || 'sale',
        employee_code: employee?.employee_code || '',
        department: employee?.department || '',
        hired_date: employee?.hired_date ? new Date(employee.hired_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validate password on change
        if (name === 'password' && value) {
            setPasswordValidation(validatePasswordStrength(value));
        } else if (name === 'password' && !value) {
            setPasswordValidation(null);
        }
    };

    const handleGeneratePassword = () => {
        const newPassword = generateStrongPassword(12);
        setFormData(prev => ({ ...prev, password: newPassword }));
        setPasswordValidation(validatePasswordStrength(newPassword));
        setShowPassword(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password for new employees
        if (!isEditing) {
            const validation = validatePasswordStrength(formData.password);
            if (!validation.isValid) {
                setPasswordValidation(validation);
                return;
            }
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên Mới'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và Tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
                                    placeholder="email@example.com"
                                />
                            </div>

                            {/* Password - Only for new employee */}
                            {!isEditing && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-black focus:border-transparent"
                                                placeholder="Tối thiểu 8 ký tự, chữ hoa, số, ký tự đặc biệt"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGeneratePassword}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                                            title="Tạo mật khẩu mạnh"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Tạo tự động
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {passwordValidation && (
                                        <div className="mt-2">
                                            {passwordValidation.isValid ? (
                                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${passwordValidation.strength.level === 'strong' ? 'bg-green-500 w-full' :
                                                                    passwordValidation.strength.level === 'medium' ? 'bg-yellow-500 w-2/3' :
                                                                        'bg-red-500 w-1/3'
                                                                }`}
                                                        />
                                                    </div>
                                                    <span className="font-medium whitespace-nowrap">
                                                        {passwordValidation.strength.label}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-red-600 text-sm space-y-1">
                                                    {passwordValidation.errors.map((error, idx) => (
                                                        <div key={idx}>• {error}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="0123456789"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vai trò <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="sale">Nhân viên Sale</option>
                                    <option value="warehouse">Nhân viên Kho</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>

                            {/* Employee Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã Nhân viên
                                </label>
                                <input
                                    type="text"
                                    name="employee_code"
                                    value={formData.employee_code}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="SALE001, WH001, ..."
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phòng ban
                                </label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="">Chọn phòng ban</option>
                                    <option value="sales">Sales</option>
                                    <option value="warehouse">Warehouse</option>
                                    <option value="admin">Admin</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="customer_service">Customer Service</option>
                                </select>
                            </div>

                            {/* Hired Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày vào làm
                                </label>
                                <input
                                    type="date"
                                    name="hired_date"
                                    value={formData.hired_date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Role Description */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-900 mb-2">
                                Quyền hạn của vai trò "{formData.role === 'sale' ? 'Nhân viên Sale' : formData.role === 'warehouse' ? 'Nhân viên Kho' : 'Quản trị viên'}"
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                {formData.role === 'sale' && (
                                    <>
                                        <li>✓ Tạo và quản lý đơn hàng của mình</li>
                                        <li>✓ Xem đơn hàng trong 30 ngày gần nhất</li>
                                        <li>✓ Xem thống kê doanh số cá nhân</li>
                                        <li>✗ Không thể xem đơn hàng của nhân viên khác</li>
                                    </>
                                )}
                                {formData.role === 'warehouse' && (
                                    <>
                                        <li>✓ Xem tất cả đơn hàng</li>
                                        <li>✓ Cập nhật trạng thái đơn hàng</li>
                                        <li>✓ Quản lý vận chuyển và kho</li>
                                        <li>✗ Không thể tạo đơn hàng mới</li>
                                    </>
                                )}
                                {formData.role === 'admin' && (
                                    <>
                                        <li>✓ Toàn quyền quản lý hệ thống</li>
                                        <li>✓ Quản lý sản phẩm, danh mục, banner</li>
                                        <li>✓ Quản lý nhân viên và phân quyền</li>
                                        <li>✓ Xem tất cả báo cáo và thống kê</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!isEditing && passwordValidation && !passwordValidation.isValid)}
                                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    isEditing ? 'Cập nhật' : 'Tạo Tài khoản'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmployeeFormModal;
