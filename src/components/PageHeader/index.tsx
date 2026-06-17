import { ReactNode } from 'react';
import { Plus, Filter, Search, Download } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  onAdd?: () => void;
  extraActions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  showAddButton = true,
  addButtonText = '新增记录',
  onAdd,
  extraActions,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {extraActions}
          {showAddButton && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} />
              {addButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilter?: boolean;
  showExport?: boolean;
  children?: ReactNode;
}

export function Toolbar({
  searchPlaceholder = '搜索...',
  searchValue,
  onSearchChange,
  showFilter = true,
  showExport = true,
  children,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {showFilter && (
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            筛选
          </button>
        )}
        {children}
      </div>
      {showExport && (
        <button className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <Download size={16} />
          导出
        </button>
      )}
    </div>
  );
}
