import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/utils/format';
import { Link } from 'react-router-dom';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Activity,
  Flame,
  Droplets,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const { workOrders, waxMoldingRecords, pouringRecords } = useStore();

  const todayOrders = workOrders.filter((o) => 
    o.createdAt.includes('2024-06-16') || o.createdAt.includes('2024-06-17')
  );

  const completedOrders = workOrders.filter((o) => o.status === 'completed').length;
  const inProgressOrders = workOrders.filter((o) => o.status !== 'completed' && o.status !== 'pending').length;
  const pendingOrders = workOrders.filter((o) => o.status === 'pending').length;
  const totalQuantity = workOrders.reduce((sum, o) => sum + o.quantity, 0);

  const totalWaxOutput = waxMoldingRecords.reduce((sum, r) => sum + r.outputCount, 0);
  const totalQualifiedWax = waxMoldingRecords.reduce((sum, r) => sum + r.qualifiedCount, 0);
  const waxPassRate = totalWaxOutput > 0 ? Math.round((totalQualifiedWax / totalWaxOutput) * 100) : 0;

  const processSteps = [
    { name: '蜡模压制', count: 2, icon: <Package size={20} />, color: 'amber' },
    { name: '模组焊接', count: 2, icon: <Activity size={20} />, color: 'yellow' },
    { name: '制壳挂砂', count: 1, icon: <Layers size={20} />, color: 'blue' },
    { name: '脱蜡焙烧', count: 1, icon: <Flame size={20} />, color: 'orange' },
    { name: '合金熔炼', count: 1, icon: <Droplets size={20} />, color: 'red' },
    { name: '浇注作业', count: 1, icon: <Droplets size={20} />, color: 'rose' },
    { name: '清理打磨', count: 1, icon: <CheckCircle size={20} />, color: 'teal' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日工单"
          value={todayOrders.length}
          unit="单"
          trend="up"
          trendValue="较昨日 +12%"
          iconType="production"
          color="blue"
        />
        <StatCard
          title="进行中工单"
          value={inProgressOrders}
          unit="单"
          iconType="efficiency"
          color="amber"
        />
        <StatCard
          title="蜡模合格率"
          value={waxPassRate}
          unit="%"
          trend="up"
          trendValue="较上周 +2.3%"
          iconType="quality"
          color="green"
        />
        <StatCard
          title="待处理预警"
          value={3}
          unit="项"
          iconType="warning"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">各工序在制数量</h3>
            <Link 
              to="/wax-molding" 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看详情 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {processSteps.map((step, index) => (
              <div key={step.name} className="text-center">
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center mb-2 bg-${step.color}-50`}>
                  <div className={`text-${step.color}-600`}>
                    {step.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{step.count}</p>
                <p className="text-xs text-slate-500 mt-1">{step.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">工单状态分布</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">已完成</span>
                <span className="font-medium text-slate-800">{completedOrders} 单</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(completedOrders / workOrders.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">进行中</span>
                <span className="font-medium text-slate-800">{inProgressOrders} 单</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(inProgressOrders / workOrders.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">待开始</span>
                <span className="font-medium text-slate-800">{pendingOrders} 单</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full transition-all"
                  style={{ width: `${(pendingOrders / workOrders.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800">{workOrders.length}</p>
              <p className="text-sm text-slate-500 mt-1">总工单数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">最新工单</h3>
          <Link 
            to="/wax-molding" 
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">工单编号</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">产品名称</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">数量</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">当前工序</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">预计交付</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-blue-600">{order.orderNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{order.productName}</p>
                      <p className="text-xs text-slate-500">{order.productCode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{order.quantity} 件</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{order.currentProcess}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.estimatedDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">今日提醒</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">蜡料库存预警</p>
                <p className="text-xs text-amber-600 mt-0.5">中温蜡料库存低于安全库存，请及时补充</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">型壳干燥即将完成</p>
                <p className="text-xs text-blue-600 mt-0.5">GD202406003 第3层型壳预计2小时后干燥完成</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800">焙烧完成</p>
                <p className="text-xs text-emerald-600 mt-0.5">GD202406005 型壳焙烧已完成，待浇注</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">生产数据概览</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">本周总产量</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">1,256 件</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">综合合格率</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">96.8%</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">在职工人</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">48 人</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">设备运行率</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">92.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
