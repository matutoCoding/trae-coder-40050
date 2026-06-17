export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export function getStatusColor(
  status: string,
  type: 'bg' | 'text' = 'bg'
): string {
  const colorMap: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    qualified: { bg: 'bg-green-100', text: 'text-green-800' },
    unqualified: { bg: 'bg-red-100', text: 'text-red-800' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    success: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    error: { bg: 'bg-red-100', text: 'text-red-800' },
  };
  return colorMap[status]?.[type] || colorMap.pending[type];
}
