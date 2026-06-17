import { useMemo } from 'react';
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
  Layers,
  Thermometer,
  ShieldCheck
} from 'lucide-react';

interface AnomalyItem {
  type: string;
  icon: React.ReactNode;
  color: 'red' | 'orange';
  orderId: string;
  orderNo: string;
  detail: string;
  value: string;
}

export default function Dashboard() {
  const { 
    workOrders, 
    waxMoldingRecords, 
    pouringRecords,
    waxInspectionRecords,
    shellMakingRecords,
    firingRecords,
    getWorkOrderById
  } = useStore();

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

  const anomalies = useMemo(() => {
    const items: AnomalyItem[] = [];

    waxInspectionRecords.forEach((r) => {
      if (!r.isQualified) {
        const order = getWorkOrderById(r.workOrderId);
        items.push({
          type: '尺寸检验不合格',
          icon: <AlertTriangle size={18} />,
          color: 'red',
          orderId: r.workOrderId,
          orderNo: order?.orderNo || '-',
          detail: `样品${r.sampleNo}检验不合格`,
          value: `${r.dimensions.filter((d) => !d.isQualified).length}项不达标`,
        });
      }
    });

    shellMakingRecords.forEach((r) => {
      let outOfRange = false;
      let rangeLabel = '';
      if (r.layerNumber === 1 && (r.viscosity < 32 || r.viscosity > 38)) {
        outOfRange = true;
        rangeLabel = '面层标准32-38s';
      } else if ((r.layerNumber === 2 || r.layerNumber === 3) && (r.viscosity < 25 || r.viscosity > 30)) {
        outOfRange = true;
        rangeLabel = '过渡层标准25-30s';
      } else if (r.layerNumber >= 4 && (r.viscosity < 20 || r.viscosity > 25)) {
        outOfRange = true;
        rangeLabel = '背层标准20-25s';
      }
      if (outOfRange) {
        const order = getWorkOrderById(r.workOrderId);
        items.push({
          type: '粘度超范围',
          icon: <Droplets size={18} />,
          color: 'orange',
          orderId: r.workOrderId,
          orderNo: order?.orderNo || '-',
          detail: `第${r.layerNumber}层粘度${rangeLabel}`,
          value: `${r.viscosity}s`,
        });
      }
    });

    firingRecords.forEach((r) => {
      const overPoints = r.curveData.filter((p) => p.temperature > 1150);
      if (overPoints.length > 0) {
        const order = getWorkOrderById(r.workOrderId);
        const maxTemp = Math.max(...overPoints.map((p) => p.temperature));
        items.push({
          type: '焙烧曲线温度异常',
          icon: <Flame size={18} />,
          color: 'red',
          orderId: r.workOrderId,
          orderNo: order?.orderNo || '-',
          detail: `${overPoints.length}个数据点超1150°C`,
          value: `最高${maxTemp}°C`,
        });
      }
    });

    pouringRecords.forEach((r) => {
      const highTemps = r.temperatureRecords.filter((t) => t.temperature > 1580);
      if (r.pouringTemperature > 1580 || highTemps.length > 0) {
        const order = getWorkOrderById(r.workOrderId);
        const displayTemp = r.pouringTemperature > 1580 ? r.pouringTemperature : highTemps[0].temperature;
        items.push({
          type: '浇注温度偏高',
          icon: <Thermometer size={18} />,
          color: 'orange',
          orderId: r.workOrderId,
          orderNo: order?.orderNo || '-',
          detail: r.pouringTemperature > 1580
            ? `浇注温度超标`
            : `${highTemps.length}个记录点超1580°C`,
          value: `${displayTemp}°C`,
        });
      }
    });

    return items;
  }, [waxInspectionRecords, shellMakingRecords, firingRecords, pouringRecords, getWorkOrderById]);

  const processSteps = useMemo(() => {
    const countByStatus = (statuses: string[]) =>
      workOrders.filter((o) => statuses.includes(o.status)).length;

    return [
      { name: '蜡模压制', count: countByStatus(['wax_molding']), icon: <Package size={20} />, color: 'amber' },
      { name: '模组焊接', count: countByStatus(['assembly']), icon: <Activity size={20} />, color: 'yellow' },
      { name: '制壳挂砂', count: countByStatus(['shell_making']), icon: <Layers size={20} />, color: 'blue' },
      { name: '脱蜡焙烧', count: countByStatus(['dewaxing', 'firing']), icon: <Flame size={20} />, color: 'orange' },
      { name: '合金熔炼', count: countByStatus(['melting']), icon: <Droplets size={20} />, color: 'red' },
      { name: '浇注作业', count: countByStatus(['pouring']), icon: <Droplets size={20} />, color: 'rose' },
      { name: '清理打磨', count: countByStatus(['cleaning']), icon: <CheckCircle size={20} />, color: 'teal' },
    ];
  }, [workOrders]);

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
          value={anomalies.length}
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
                    <Link to={`/work-order/${order.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{order.orderNo}</Link>
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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">异常提醒</h3>
          {anomalies.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
              <ShieldCheck size={22} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">暂无异常</p>
                <p className="text-xs text-emerald-600 mt-0.5">所有检测数据均在正常范围内</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.color === 'red' ? 'bg-red-50' : 'bg-orange-50'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${
                    item.color === 'red' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        item.color === 'red' ? 'text-red-800' : 'text-orange-800'
                      }`}>
                        {item.type}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        item.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.value}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${
                      item.color === 'red' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {item.detail}
                    </p>
                    <Link
                      to={`/work-order/${item.orderId}`}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                    >
                      工单: {item.orderNo} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
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
