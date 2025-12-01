/**
 * Image Optimization Utilities for BEWO
 * Supports Supabase Storage Image Transformation
 */

/**
 * Check if URL is from Supabase Storage
 */
export const isSupabaseUrl = (url) => {
  return url && url.includes('supabase.co/storage');
};

/**
 * Get optimized image URL with Supabase Image Transformation
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 * 
 * @param {string} url - Original image URL
 * @param {object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 80,
    format = 'webp', // 'webp' or 'origin'
    resize = 'contain' // 'cover', 'contain', 'fill'
  } = options;

  if (!url) return '';
  
  // Nếu không phải Supabase URL, return original
  if (!isSupabaseUrl(url)) {
    return url;
  }

  // Parse URL
  const urlObj = new URL(url);
  
  // Build transformation params
  const params = [];
  
  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);
  if (resize) params.push(`resize=${resize}`);

  // Add params to URL
  if (params.length > 0) {
    urlObj.searchParams.set('transform', params.join(','));
  }

  return urlObj.toString();
};

/**
 * Generate responsive srcSet for product images
 * Optimized for product cards (aspect ratio 3:4)
 */
export const getProductImageSrcSet = (url) => {
  if (!isSupabaseUrl(url)) return url;

  const sizes = [
    { width: 320, quality: 65 },  // Mobile - reduced from 75
    { width: 640, quality: 70 },  // Tablet - reduced from 75
    { width: 960, quality: 75 },  // Desktop - reduced from 80
  ];

  return sizes
    .map(({ width, quality }) => 
      `${getOptimizedImageUrl(url, { width, quality, format: 'webp' })} ${width}w`
    )
    .join(', ');
};

/**
 * Generate responsive srcSet for banner images
 * Optimized for hero banners (full width)
 */
export const getBannerImageSrcSet = (url) => {
  if (!isSupabaseUrl(url)) return url;

  const sizes = [
    { width: 640, quality: 60 },   // Mobile - reduced from 70
    { width: 1024, quality: 65 },  // Tablet - reduced from 75
    { width: 1920, quality: 70 },  // Desktop - reduced from 80
    { width: 2560, quality: 75 },  // Large screens - reduced from 85
  ];

  return sizes
    .map(({ width, quality }) => 
      `${getOptimizedImageUrl(url, { width, quality, format: 'webp' })} ${width}w`
    )
    .join(', ');
};

/**
 * Generate responsive srcSet for logo/icon images
 * Small images, higher quality
 */
export const getLogoImageSrcSet = (url) => {
  if (!isSupabaseUrl(url)) return url;

  const sizes = [
    { width: 100, quality: 90 },
    { width: 200, quality: 90 },
    { width: 400, quality: 90 },
  ];

  return sizes
    .map(({ width, quality }) => 
      `${getOptimizedImageUrl(url, { width, quality, format: 'webp' })} ${width}w`
    )
    .join(', ');
};

/**
 * Get thumbnail URL
 * Small, highly compressed version for previews
 */
export const getThumbnailUrl = (url, size = 200) => {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    quality: 70,
    format: 'webp',
    resize: 'cover'
  });
};

/**
 * Preload critical images (LCP)
 * Call this for above-the-fold images
 */
export const preloadImage = (url, type = 'image/webp') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.type = type;
  link.fetchpriority = 'high';
  document.head.appendChild(link);
};

/**
 * Check if browser supports WebP
 */
export const supportsWebP = () => {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get appropriate image format based on browser support
 */
export const getOptimalFormat = () => {
  // Check AVIF support (newest, best compression)
  const avif = new Image();
  avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  if (avif.complete && avif.width === 2) {
    return 'avif';
  }
  
  // Check WebP support
  if (supportsWebP()) {
    return 'webp';
  }
  
  // Fallback to original
  return 'origin';
};

/**
 * Helper: Get sizes attribute for responsive images
 */
export const getImageSizes = (type = 'product') => {
  const sizeMap = {
    product: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
    banner: '100vw',
    logo: '(max-width: 768px) 70px, 100px',
    thumbnail: '200px'
  };
  
  return sizeMap[type] || sizeMap.product;
};

export default {
  getOptimizedImageUrl,
  getProductImageSrcSet,
  getBannerImageSrcSet,
  getLogoImageSrcSet,
  getThumbnailUrl,
  preloadImage,
  supportsWebP,
  getOptimalFormat,
  getImageSizes,
  isSupabaseUrl
};
