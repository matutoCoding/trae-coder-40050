import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Ruler, 
  Wrench, 
  Layers, 
  Flame, 
  Factory, 
  Droplets,
  Sparkles,
  ChevronRight,
  Settings,
  Bell,
  User
} from 'lucide-react';

interface NavItemConfig {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItemConfigs: NavItemConfig[] = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard },
  { path: '/wax-molding', label: '蜡模压制', icon: Package },
  { path: '/wax-inspection', label: '蜡件检验', icon: Ruler },
  { path: '/assembly-welding', label: '模组焊接', icon: Wrench },
  { path: '/shell-making', label: '制壳挂砂', icon: Layers },
  { path: '/dewaxing-firing', label: '脱蜡焙烧', icon: Flame },
  { path: '/alloy-melting', label: '合金熔炼', icon: Factory },
  { path: '/pouring', label: '浇注作业', icon: Droplets },
  { path: '/cleaning-polishing', label: '清理打磨', icon: Sparkles },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = navItemConfigs.map((item) => ({
    path: item.path,
    label: item.label,
    icon: <item.icon size={20} />,
  }));

  return (
    <div className="flex h-screen bg-slate-50">
      <aside 
        className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Factory size={20} />
              </div>
              <span className="font-bold text-lg">熔铸管理系统</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
              <Factory size={20} />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight 
              size={20} 
              className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} 
            />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.label || '熔模铸造管理系统'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-700">管理员</p>
                <p className="text-xs text-slate-500">admin@foundry.com</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
