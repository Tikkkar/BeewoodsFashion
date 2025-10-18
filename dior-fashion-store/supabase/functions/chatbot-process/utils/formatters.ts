// ============================================
// utils/formatters.ts - Format utilities
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateCost(tokens: number): number {
  return tokens * 0.4 / 1_000_000 * 0.125 + tokens * 0.6 / 1_000_000 * 0.375;
}
