export const formatPrice = (price) => {
  return `${price.toLocaleString('vi-VN')} VND`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

export const generateId = (items) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(item => item.id)) + 1;
};