import type { WorkOrderStatus } from '@/types';
import { statusLabels, statusColors } from '@/types';

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60"></span>
      {statusLabels[status]}
    </span>
  );
}
