import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { statusLabels } from '@/types';
import type { WorkOrderStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime } from '@/utils/format';
import {
  ArrowLeft,
  Package,
  ClipboardCheck,
  Link2,
  Layers,
  Flame,
  Droplets,
  Beaker,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ProcessStep {
  status: WorkOrderStatus;
  label: string;
  icon: React.ReactNode;
  route: string;
}

const processSteps: ProcessStep[] = [
  { status: 'pending', label: '待开始', icon: <Clock size={18} />, route: '/' },
  { status: 'wax_molding', label: '蜡模压制', icon: <Package size={18} />, route: '/wax-molding' },
  { status: 'wax_inspection', label: '蜡件检验', icon: <ClipboardCheck size={18} />, route: '/wax-inspection' },
  { status: 'assembly', label: '模组焊接', icon: <Link2 size={18} />, route: '/assembly-welding' },
  { status: 'shell_making', label: '制壳挂砂', icon: <Layers size={18} />, route: '/shell-making' },
  { status: 'dewaxing', label: '脱蜡', icon: <Flame size={18} />, route: '/dewaxing-firing' },
  { status: 'firing', label: '焙烧', icon: <Flame size={18} />, route: '/dewaxing-firing' },
  { status: 'melting', label: '合金熔炼', icon: <Beaker size={18} />, route: '/alloy-melting' },
  { status: 'pouring', label: '浇注作业', icon: <Droplets size={18} />, route: '/pouring' },
  { status: 'cleaning', label: '清理打磨', icon: <Sparkles size={18} />, route: '/cleaning-polishing' },
  { status: 'completed', label: '已完成', icon: <CheckCircle2 size={18} />, route: '/' },
];

const statusOrder: WorkOrderStatus[] = [
  'pending', 'wax_molding', 'wax_inspection', 'assembly', 'shell_making',
  'dewaxing', 'firing', 'melting', 'pouring', 'cleaning', 'completed',
];

function getStepState(stepStatus: WorkOrderStatus, currentStatus: WorkOrderStatus): 'completed' | 'active' | 'pending' {
  const stepIdx = statusOrder.indexOf(stepStatus);
  const currentIdx = statusOrder.indexOf(currentStatus);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

function getLatestRecordInfo(
  status: WorkOrderStatus,
  getWaxMoldingByOrderId: (id: string) => any[],
  getWaxInspectionByOrderId: (id: string) => any[],
  getAssemblyByOrderId: (id: string) => any[],
  getShellMakingByOrderId: (id: string) => any[],
  getDewaxingByOrderId: (id: string) => any[],
  getFiringByOrderId: (id: string) => any[],
  getMeltingByOrderId: (id: string) => any[],
  getPouringByOrderId: (id: string) => any[],
  getCleaningByOrderId: (id: string) => any[],
  orderId: string,
): { operator: string; time: string; qualityResult: string } | null {
  const fetchers: Record<WorkOrderStatus, () => any[]> = {
    pending: () => [],
    wax_molding: () => getWaxMoldingByOrderId(orderId),
    wax_inspection: () => getWaxInspectionByOrderId(orderId),
    assembly: () => getAssemblyByOrderId(orderId),
    shell_making: () => getShellMakingByOrderId(orderId),
    dewaxing: () => getDewaxingByOrderId(orderId),
    firing: () => getFiringByOrderId(orderId),
    melting: () => getMeltingByOrderId(orderId),
    pouring: () => getPouringByOrderId(orderId),
    cleaning: () => getCleaningByOrderId(orderId),
    completed: () => getCleaningByOrderId(orderId),
  };

  const records = fetchers[status]();
  if (records.length === 0) return null;

  const latest = records[records.length - 1];
  const operator = latest.operator ?? latest.inspector ?? latest.welder ?? '-';
  const time = latest.startTime ?? latest.inspectTime ?? latest.weldingTime ?? latest.operateTime ?? latest.pourTime ?? '-';
  let qualityResult = '';

  if (status === 'wax_molding') {
    qualityResult = `产出 ${latest.outputCount} / 合格 ${latest.qualifiedCount}`;
  } else if (status === 'wax_inspection') {
    qualityResult = latest.isQualified ? '检验合格' : '检验不合格';
  } else if (status === 'assembly') {
    qualityResult = latest.inspectionResult ? '焊接合格' : '焊接不合格';
  } else if (status === 'dewaxing') {
    qualityResult = latest.result ?? '-';
  } else if (status === 'melting') {
    qualityResult = `温度 ${latest.meltingTemperature}℃`;
  } else if (status === 'pouring') {
    qualityResult = `浇注 ${latest.pouredCount} / 合格 ${latest.qualifiedCount}`;
  } else if (status === 'cleaning') {
    qualityResult = latest.qualityResult ?? '-';
  }

  return { operator, time: formatDateTime(time), qualityResult };
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    getWorkOrderById,
    getWaxMoldingByOrderId,
    getWaxInspectionByOrderId,
    getAssemblyByOrderId,
    getShellMakingByOrderId,
    getDewaxingByOrderId,
    getFiringByOrderId,
    getMeltingByOrderId,
    getPouringByOrderId,
    getCleaningByOrderId,
  } = useStore();

  const order = getWorkOrderById(id ?? '');

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-slate-500 mb-4">未找到该工单</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> 返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">工单详情</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">工单编号</p>
            <p className="text-sm font-semibold text-slate-800">{order.orderNo}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">产品名称</p>
            <p className="text-sm font-semibold text-slate-800">{order.productName}</p>
            <p className="text-xs text-slate-400">{order.productCode}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">数量</p>
            <p className="text-sm font-semibold text-slate-800">{order.quantity} 件</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">客户</p>
            <p className="text-sm font-semibold text-slate-800">{order.customer ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">当前状态</p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">预计交付</p>
            <p className="text-sm font-semibold text-slate-800">{order.estimatedDelivery}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">流转时间线</h3>
        <div className="relative">
          {processSteps.map((step, index) => {
            const stepState = getStepState(step.status, order.status);
            const recordInfo = getLatestRecordInfo(
              step.status,
              getWaxMoldingByOrderId,
              getWaxInspectionByOrderId,
              getAssemblyByOrderId,
              getShellMakingByOrderId,
              getDewaxingByOrderId,
              getFiringByOrderId,
              getMeltingByOrderId,
              getPouringByOrderId,
              getCleaningByOrderId,
              order.id,
            );

            const isLast = index === processSteps.length - 1;

            let dotColor = 'bg-slate-300';
            let lineColor = 'bg-slate-200';
            let textColor = 'text-slate-400';
            let iconColor = 'text-slate-400';
            let labelWeight = 'font-medium';

            if (stepState === 'completed') {
              dotColor = 'bg-emerald-500';
              lineColor = 'bg-emerald-300';
              textColor = 'text-slate-800';
              iconColor = 'text-emerald-600';
            } else if (stepState === 'active') {
              dotColor = 'bg-blue-500';
              lineColor = 'bg-slate-200';
              textColor = 'text-blue-700';
              iconColor = 'text-blue-600';
              labelWeight = 'font-bold';
            }

            return (
              <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dotColor} ${
                      stepState === 'active' ? 'ring-4 ring-blue-100 animate-pulse' : ''
                    }`}
                  >
                    <span className="text-white">{step.icon}</span>
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 mt-1 ${lineColor}`} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={step.route}
                      className={`${labelWeight} ${textColor} hover:text-blue-600 transition-colors`}
                    >
                      {step.label}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        stepState === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : stepState === 'active'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {stepState === 'completed' ? '已完成' : stepState === 'active' ? '进行中' : '待开始'}
                    </span>
                  </div>
                  {recordInfo && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        操作人：<span className="text-slate-700">{recordInfo.operator}</span>
                      </span>
                      <span>
                        时间：<span className="text-slate-700">{recordInfo.time}</span>
                      </span>
                      {recordInfo.qualityResult && (
                        <span>
                          质量结果：<span className="text-slate-700">{recordInfo.qualityResult}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
