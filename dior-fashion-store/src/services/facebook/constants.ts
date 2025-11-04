// ==================================================
// services/facebook/constants.ts
// Facebook Marketing API constants and configurations
// ==================================================

export const FACEBOOK_CONFIG = {
  // API Version
  API_VERSION: 'v21.0',
  
  // Base URLs
  BASE_URL: 'https://graph.facebook.com',
  
  // Endpoints
  ENDPOINTS: {
    SEARCH: '/search',
    AD_INTERESTS: '/search',
    BEHAVIORS: '/search',
    DEMOGRAPHICS: '/search',
    TARGETING_BROWSE: '/search',
  },
  
  // Targeting Categories
  TARGETING_TYPES: {
    INTERESTS: 'adinterest',
    BEHAVIORS: 'adbehavior',
    DEMOGRAPHICS: 'addemographics',
    WORK: 'adworkemployer',
    EDUCATION: 'adeducationschool',
    LOCALE: 'adlocale',
  },
  
  // Cache TTL (Time to Live)
  CACHE_TTL: {
    INTERESTS: 7 * 24 * 60 * 60 * 1000, // 7 days
    BEHAVIORS: 7 * 24 * 60 * 60 * 1000, // 7 days
    DEMOGRAPHICS: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // Rate Limits
  RATE_LIMITS: {
    MAX_REQUESTS_PER_HOUR: 200,
    MAX_BATCH_SIZE: 50,
  },
  
  // Search Limits
  SEARCH_LIMITS: {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    MAX_RESULTS: 1000,
    DEFAULT_LIMIT: 10,
  },
};

// Common Vietnamese interests for fashion e-commerce
export const VIETNAMESE_FASHION_INTERESTS = [
  'Thời trang',
  'Quần áo',
  'Phụ kiện thời trang',
  'Giày dép',
  'Túi xách',
  'Đồ nữ',
  'Đồ công sở',
  'Váy đầm',
  'Fashion design',
  'Luxury fashion',
  'Street fashion',
  'Online shopping',
];

// Job titles commonly available in Facebook
export const COMMON_JOB_TITLES = [
  'Software Engineer',
  'Developer',
  'Designer',
  'Marketing Manager',
  'Sales Manager',
  'Teacher',
  'Doctor',
  'Accountant',
  'CEO',
  'Entrepreneur',
];

// Vietnam locations
export const VIETNAM_LOCATIONS = {
  MAJOR_CITIES: [
    { name: 'Ho Chi Minh City', key: 'hcmc' },
    { name: 'Hanoi', key: 'hanoi' },
    { name: 'Da Nang', key: 'danang' },
    { name: 'Hai Phong', key: 'haiphong' },
    { name: 'Can Tho', key: 'cantho' },
  ],
  REGIONS: [
    { name: 'North Vietnam', key: 'north' },
    { name: 'Central Vietnam', key: 'central' },
    { name: 'South Vietnam', key: 'south' },
  ],
};

// Age ranges
export const AGE_RANGES = [
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55-64', min: 55, max: 64 },
  { label: '65+', min: 65, max: null },
];

// Error messages
export const ERROR_MESSAGES = {
  INVALID_TOKEN: 'Facebook access token không hợp lệ hoặc đã hết hạn',
  RATE_LIMIT: 'Đã vượt quá giới hạn request. Vui lòng thử lại sau',
  NETWORK_ERROR: 'Lỗi kết nối với Facebook API',
  INVALID_QUERY: 'Từ khóa tìm kiếm không hợp lệ',
  NO_RESULTS: 'Không tìm thấy kết quả phù hợp',
  GENERIC_ERROR: 'Có lỗi xảy ra khi kết nối với Facebook',
};