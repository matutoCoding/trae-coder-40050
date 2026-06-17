import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  iconType: 'production' | 'quality' | 'efficiency' | 'warning';
  color?: 'blue' | 'green' | 'amber' | 'red';
}

const iconMap = {
  production: Package,
  quality: CheckCircle,
  efficiency: Clock,
  warning: AlertTriangle,
};

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    value: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    value: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    value: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    value: 'text-red-600',
  },
};

const trendIconMap = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColorMap = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  stable: 'text-slate-500',
};

export default function StatCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  iconType,
  color = 'blue',
}: StatCardProps) {
  const Icon = iconMap[iconType];
  const colors = colorMap[color];
  const TrendIcon = trend ? trendIconMap[trend] : null;
  const trendColor = trend ? trendColorMap[trend] : '';

  return (
    <div className={`${colors.bg} rounded-xl p-6 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${colors.value}`}>{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              <TrendIcon size={14} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`${colors.iconBg} p-3 rounded-xl`}>
          <Icon size={24} className={colors.iconColor} />
        </div>
      </div>
    </div>
  );
}
