/**
 * Vietnam Address Service
 * Provides province, district, and ward data for Vietnam
 * Uses public API: https://provinces.open-api.vn/api/
 */

const API_BASE = 'https://provinces.open-api.vn/api';

// Cache to avoid repeated API calls
let provincesCache = null;
let districtsCache = {};
let wardsCache = {};

/**
 * Fetch all provinces in Vietnam
 * @returns {Promise<Array>} List of provinces
 */
export const getProvinces = async () => {
    if (provincesCache) {
        return provincesCache;
    }

    try {
        const response = await fetch(`${API_BASE}/p/`);
        if (!response.ok) throw new Error('Failed to fetch provinces');

        const data = await response.json();
        provincesCache = data.map(p => ({
            code: p.code,
            name: p.name,
            nameEn: p.name_en,
            fullName: p.full_name,
            fullNameEn: p.full_name_en
        }));

        return provincesCache;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        // Fallback to basic list if API fails
        return getFallbackProvinces();
    }
};

/**
 * Fetch districts by province code
 * @param {number} provinceCode - Province code
 * @returns {Promise<Array>} List of districts
 */
export const getDistricts = async (provinceCode) => {
    if (!provinceCode) return [];

    const cacheKey = `p${provinceCode}`;
    if (districtsCache[cacheKey]) {
        return districtsCache[cacheKey];
    }

    try {
        const response = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
        if (!response.ok) throw new Error('Failed to fetch districts');

        const data = await response.json();
        const districts = data.districts.map(d => ({
            code: d.code,
            name: d.name,
            nameEn: d.name_en,
            fullName: d.full_name,
            fullNameEn: d.full_name_en,
            provinceCode: provinceCode
        }));

        districtsCache[cacheKey] = districts;
        return districts;
    } catch (error) {
        console.error('Error fetching districts:', error);
        return [];
    }
};

/**
 * Fetch wards by district code
 * @param {number} districtCode - District code
 * @returns {Promise<Array>} List of wards
 */
export const getWards = async (districtCode) => {
    if (!districtCode) return [];

    const cacheKey = `d${districtCode}`;
    if (wardsCache[cacheKey]) {
        return wardsCache[cacheKey];
    }

    try {
        const response = await fetch(`${API_BASE}/d/${districtCode}?depth=2`);
        if (!response.ok) throw new Error('Failed to fetch wards');

        const data = await response.json();
        const wards = data.wards.map(w => ({
            code: w.code,
            name: w.name,
            nameEn: w.name_en,
            fullName: w.full_name,
            fullNameEn: w.full_name_en,
            districtCode: districtCode
        }));

        wardsCache[cacheKey] = wards;
        return wards;
    } catch (error) {
        console.error('Error fetching wards:', error);
        return [];
    }
};

/**
 * Search provinces by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Filtered provinces
 */
export const searchProvinces = async (query) => {
    const provinces = await getProvinces();
    if (!query) return provinces;

    const lowerQuery = query.toLowerCase();
    return provinces.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.fullName.toLowerCase().includes(lowerQuery)
    );
};

/**
 * Fallback province list (major cities) if API fails
 */
const getFallbackProvinces = () => [
    { code: 1, name: 'Hà Nội', fullName: 'Thành phố Hà Nội' },
    { code: 79, name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh' },
    { code: 48, name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng' },
    { code: 31, name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng' },
    { code: 92, name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ' },
    { code: 56, name: 'Khánh Hòa', fullName: 'Tỉnh Khánh Hòa' },
    { code: 26, name: 'Thừa Thiên Huế', fullName: 'Tỉnh Thừa Thiên Huế' },
];

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export const clearCache = () => {
    provincesCache = null;
    districtsCache = {};
    wardsCache = {};
};
