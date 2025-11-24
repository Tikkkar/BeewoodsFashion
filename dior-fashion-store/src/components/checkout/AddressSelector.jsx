import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getProvinces, getDistricts, getWards } from '../../lib/services/vietnamAddress';

/**
 * AddressSelector Component
 * Cascading dropdown for selecting Province -> District -> Ward
 */
const AddressSelector = ({ value, onChange, error }) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);

    const [loading, setLoading] = useState({
        provinces: false,
        districts: false,
        wards: false
    });

    // Load provinces on mount
    useEffect(() => {
        loadProvinces();
    }, []);

    const loadProvinces = async () => {
        setLoading(prev => ({ ...prev, provinces: true }));
        try {
            const data = await getProvinces();
            setProvinces(data);
        } catch (error) {
            console.error('Failed to load provinces:', error);
        } finally {
            setLoading(prev => ({ ...prev, provinces: false }));
        }
    };

    const handleProvinceChange = async (e) => {
        const code = parseInt(e.target.value);
        if (!code) {
            setSelectedProvince(null);
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setSelectedWard(null);
            onChange({ city: '', district: '', ward: '', cityCode: null, districtCode: null, wardCode: null });
            return;
        }

        const province = provinces.find(p => p.code === code);
        setSelectedProvince(province);
        setSelectedDistrict(null);
        setSelectedWard(null);
        setWards([]);

        // Load districts
        setLoading(prev => ({ ...prev, districts: true }));
        try {
            const data = await getDistricts(code);
            setDistricts(data);
            onChange({
                city: province.name,
                district: '',
                ward: '',
                cityCode: province.code,
                districtCode: null,
                wardCode: null
            });
        } catch (error) {
            console.error('Failed to load districts:', error);
        } finally {
            setLoading(prev => ({ ...prev, districts: false }));
        }
    };

    const handleDistrictChange = async (e) => {
        const code = parseInt(e.target.value);
        if (!code) {
            setSelectedDistrict(null);
            setWards([]);
            setSelectedWard(null);
            onChange({
                city: selectedProvince?.name || '',
                district: '',
                ward: '',
                cityCode: selectedProvince?.code || null,
                districtCode: null,
                wardCode: null
            });
            return;
        }

        const district = districts.find(d => d.code === code);
        setSelectedDistrict(district);
        setSelectedWard(null);

        // Load wards
        setLoading(prev => ({ ...prev, wards: true }));
        try {
            const data = await getWards(code);
            setWards(data);
            onChange({
                city: selectedProvince?.name || '',
                district: district.name,
                ward: '',
                cityCode: selectedProvince?.code || null,
                districtCode: district.code,
                wardCode: null
            });
        } catch (error) {
            console.error('Failed to load wards:', error);
        } finally {
            setLoading(prev => ({ ...prev, wards: false }));
        }
    };

    const handleWardChange = (e) => {
        const code = parseInt(e.target.value);
        if (!code) {
            setSelectedWard(null);
            onChange({
                city: selectedProvince?.name || '',
                district: selectedDistrict?.name || '',
                ward: '',
                cityCode: selectedProvince?.code || null,
                districtCode: selectedDistrict?.code || null,
                wardCode: null
            });
            return;
        }

        const ward = wards.find(w => w.code === code);
        setSelectedWard(ward);
        onChange({
            city: selectedProvince?.name || '',
            district: selectedDistrict?.name || '',
            ward: ward.name,
            cityCode: selectedProvince?.code || null,
            districtCode: selectedDistrict?.code || null,
            wardCode: ward.code
        });
    };

    return (
        <div className="space-y-4">
            {/* Province Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select
                        value={selectedProvince?.code || ''}
                        onChange={handleProvinceChange}
                        disabled={loading.provinces}
                        className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-black focus:border-transparent ${error && !selectedProvince ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">
                            {loading.provinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}
                        </option>
                        {provinces.map(province => (
                            <option key={province.code} value={province.code}>
                                {province.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* District Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select
                        value={selectedDistrict?.code || ''}
                        onChange={handleDistrictChange}
                        disabled={!selectedProvince || loading.districts}
                        className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-black focus:border-transparent ${error && !selectedDistrict ? 'border-red-500' : 'border-gray-300'
                            } ${!selectedProvince ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="">
                            {loading.districts ? 'Đang tải...' : 'Chọn Quận/Huyện'}
                        </option>
                        {districts.map(district => (
                            <option key={district.code} value={district.code}>
                                {district.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Ward Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phường/Xã <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select
                        value={selectedWard?.code || ''}
                        onChange={handleWardChange}
                        disabled={!selectedDistrict || loading.wards}
                        className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-black focus:border-transparent ${error && !selectedWard ? 'border-red-500' : 'border-gray-300'
                            } ${!selectedDistrict ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="">
                            {loading.wards ? 'Đang tải...' : 'Chọn Phường/Xã'}
                        </option>
                        {wards.map(ward => (
                            <option key={ward.code} value={ward.code}>
                                {ward.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
};

export default AddressSelector;
