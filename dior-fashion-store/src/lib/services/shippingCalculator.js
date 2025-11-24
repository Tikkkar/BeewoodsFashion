/**
 * Shipping Calculator Service
 * Calculates shipping fee for orders
 */

const FIXED_SHIPPING_FEE = 30000; // 30,000 VND

/**
 * Calculate shipping fee for an order
 * @param {Array} cartItems - Cart items
 * @param {Object} destination - Destination address {city, district, ward}
 * @returns {number} Shipping fee in VND
 */
export const calculateShippingFee = (cartItems, destination) => {
    // Fixed shipping fee as per requirement
    return FIXED_SHIPPING_FEE;
};

/**
 * Calculate total weight of cart items
 * @param {Array} cartItems - Cart items with weight_g
 * @returns {number} Total weight in grams
 */
export const calculateTotalWeight = (cartItems) => {
    if (!cartItems || cartItems.length === 0) return 0;

    return cartItems.reduce((total, item) => {
        const itemWeight = item.weight || item.weight_g || 500; // Default 500g if not specified
        return total + (itemWeight * item.quantity);
    }, 0);
};

/**
 * Estimate delivery time based on destination
 * @param {Object} destination - Destination address {city, district, ward}
 * @returns {string} Estimated delivery time
 */
export const estimateDeliveryTime = (destination) => {
    if (!destination || !destination.city) {
        return '2-3 ngày';
    }

    const cityName = destination.city.toLowerCase();

    // Major cities: faster delivery
    if (cityName.includes('hà nội') || cityName.includes('hồ chí minh') || cityName.includes('đà nẵng')) {
        return '1-2 ngày';
    }

    // Other cities
    return '2-3 ngày';
};

/**
 * Validate address completeness
 * @param {Object} address - Address object {city, district, ward, fullAddress}
 * @returns {Object} {isValid: boolean, errors: Array}
 */
export const validateAddress = (address) => {
    const errors = [];

    if (!address.city || address.city.trim() === '') {
        errors.push('Vui lòng chọn Tỉnh/Thành phố');
    }

    if (!address.district || address.district.trim() === '') {
        errors.push('Vui lòng chọn Quận/Huyện');
    }

    if (!address.ward || address.ward.trim() === '') {
        errors.push('Vui lòng chọn Phường/Xã');
    }

    if (!address.fullAddress || address.fullAddress.trim() === '') {
        errors.push('Vui lòng nhập số nhà, tên đường');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Format full address string
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
export const formatFullAddress = (address) => {
    const parts = [
        address.fullAddress,
        address.ward,
        address.district,
        address.city
    ].filter(Boolean);

    return parts.join(', ');
};
