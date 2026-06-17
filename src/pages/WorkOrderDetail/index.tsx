import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { statusLabels } from '@/types';
import type { WorkOrderStatus, WaxMoldingRecord, WaxInspectionRecord, AssemblyRecord, ShellMakingRecord, DewaxingRecord, FiringRecord, MeltingRecord, PouringRecord, CleaningRecord } from '@/types';
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
  Eye,
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
  } else if (status === 'shell_making') {
    qualityResult = `第${latest.layerNumber}层 / 粘度${latest.viscosity}s / 干燥${latest.dryTime}小时`;
  } else if (status === 'dewaxing') {
    qualityResult = latest.result ?? '-';
  } else if (status === 'firing') {
    const maxTemp = latest.curveData?.length
      ? Math.max(...latest.curveData.map((p: any) => p.temperature))
      : latest.maxTemperature ?? 0;
    const zoneCount = latest.curveData?.length ?? 0;
    qualityResult = `最高温${maxTemp}°C / 共${zoneCount}个温区`;
  } else if (status === 'melting') {
    qualityResult = `温度 ${latest.meltingTemperature}℃`;
  } else if (status === 'pouring') {
    qualityResult = `浇注 ${latest.pouredCount} / 合格 ${latest.qualifiedCount}`;
  } else if (status === 'cleaning') {
    qualityResult = latest.qualityResult ?? '-';
  }

  return { operator, time: formatDateTime(time), qualityResult };
}

function getLatestRecord(
  status: WorkOrderStatus,
  getWaxMoldingByOrderId: (id: string) => WaxMoldingRecord[],
  getWaxInspectionByOrderId: (id: string) => WaxInspectionRecord[],
  getAssemblyByOrderId: (id: string) => AssemblyRecord[],
  getShellMakingByOrderId: (id: string) => ShellMakingRecord[],
  getDewaxingByOrderId: (id: string) => DewaxingRecord[],
  getFiringByOrderId: (id: string) => FiringRecord[],
  getMeltingByOrderId: (id: string) => MeltingRecord[],
  getPouringByOrderId: (id: string) => PouringRecord[],
  getCleaningByOrderId: (id: string) => CleaningRecord[],
  orderId: string,
): any | null {
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
  return records[records.length - 1];
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedStep, setSelectedStep] = useState<WorkOrderStatus | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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

  const handleViewDetail = (status: WorkOrderStatus) => {
    setSelectedStep(status);
    setShowDetail(true);
  };

  const selectedRecord = selectedStep && order
    ? getLatestRecord(
        selectedStep,
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
      )
    : null;

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
                  {recordInfo && step.status !== 'pending' && step.status !== 'completed' && (
                    <button
                      onClick={() => handleViewDetail(step.status)}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Eye size={12} />
                      查看记录
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDetail && selectedStep && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {statusLabels[selectedStep]}详情
              </h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedStep === 'wax_molding' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">模具编号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.moldNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">蜡料类型</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.waxMaterial}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">工艺参数</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedRecord.waxTemperature}°C</p>
                        <p className="text-xs text-slate-500 mt-1">蜡料温度</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{selectedRecord.moldTemperature}°C</p>
                        <p className="text-xs text-slate-500 mt-1">模具温度</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{selectedRecord.pressPressure} MPa</p>
                        <p className="text-xs text-slate-500 mt-1">压注压力</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">保压时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.holdTime} 秒</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">生产周期</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.cycleTime} 秒</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-700 mb-3">生产统计</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{selectedRecord.outputCount}</p>
                        <p className="text-xs text-slate-500 mt-1">总产出</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{selectedRecord.qualifiedCount}</p>
                        <p className="text-xs text-slate-500 mt-1">合格品</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {selectedRecord.outputCount - selectedRecord.qualifiedCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">不合格品</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600">合格率</span>
                        <span className="font-bold text-emerald-700">
                          {selectedRecord.outputCount > 0
                            ? ((selectedRecord.qualifiedCount / selectedRecord.outputCount) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.endTime)}</p>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'wax_inspection' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">样品号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.sampleNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">检验员</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.inspector}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">检验时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.inspectTime)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">表面质量</h4>
                    <p className="text-base font-medium text-slate-800">{selectedRecord.surfaceQuality}</p>
                  </div>

                  {selectedRecord.dimensions && selectedRecord.dimensions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">尺寸检验</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-3 py-2 text-left text-slate-600 font-medium">检验项</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">标准值</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">公差</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">实测值</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">偏差</th>
                              <th className="px-3 py-2 text-center text-slate-600 font-medium">结果</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.dimensions.map((dim: any, idx: number) => (
                              <tr key={idx} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-800">{dim.name}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{dim.standard}</td>
                                <td className="px-3 py-2 text-right text-slate-700">±{dim.tolerance}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{dim.actual}</td>
                                <td className={`px-3 py-2 text-right ${Math.abs(dim.deviation) > dim.tolerance ? 'text-red-600' : 'text-slate-700'}`}>
                                  {dim.deviation > 0 ? '+' : ''}{dim.deviation}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    dim.isQualified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {dim.isQualified ? '合格' : '不合格'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-700">检验结论</span>
                      <span className={`text-base font-bold ${selectedRecord.isQualified ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedRecord.isQualified ? '检验合格' : '检验不合格'}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'assembly' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">模组编号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.assemblyNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">蜡件数量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.waxCount} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焊接方式</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.weldingMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焊接温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.weldingTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焊工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.welder}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">焊接时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.weldingTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">检验员</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.inspector}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-700">检验结果</span>
                      <span className={`text-base font-bold ${selectedRecord.inspectionResult ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedRecord.inspectionResult ? '焊接合格' : '焊接不合格'}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'shell_making' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">层数</p>
                      <p className="text-base font-medium text-slate-800">第 {selectedRecord.layerNumber} 层</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">涂料类型</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.slurryType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">涂料粘度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.viscosity} s</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">砂料类型</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.sandType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">砂料目数</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.sandMesh}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.operateTime)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-700 mb-3">干燥环境</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedRecord.dryTime} h</p>
                        <p className="text-xs text-slate-500 mt-1">干燥时长</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{selectedRecord.dryTemperature}°C</p>
                        <p className="text-xs text-slate-500 mt-1">干燥温度</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{selectedRecord.dryHumidity}%</p>
                        <p className="text-xs text-slate-500 mt-1">环境湿度</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedStep === 'dewaxing' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡釜号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.kettleNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">工作压力</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.pressure} MPa</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.duration} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">蜡回收率</p>
                      <p className="text-base font-medium text-emerald-600">{selectedRecord.waxRecovery}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结果</p>
                      <p className={`text-base font-bold ${selectedRecord.result === '合格' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedRecord.result}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.endTime)}</p>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'firing' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焙烧炉号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.furnaceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">最高温度</p>
                      <p className="text-base font-bold text-red-600">{selectedRecord.maxTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">保温时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.holdTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">总时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.totalTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                  </div>

                  {selectedRecord.curveData && selectedRecord.curveData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">焙烧曲线数据</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-3 py-2 text-left text-slate-600 font-medium">序号</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">时间(min)</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">温度(°C)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.curveData.map((point: any, idx: number) => (
                              <tr key={idx} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{point.time}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{point.temperature}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.endTime)}</p>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'melting' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">炉号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.furnaceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">合金牌号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.alloyGrade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">总重量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.totalWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">熔炼温度</p>
                      <p className="text-base font-bold text-orange-600">{selectedRecord.meltingTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">除气时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.degassingTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">熔炼时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.meltingTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                  </div>

                  {selectedRecord.materials && selectedRecord.materials.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">配料明细</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-3 py-2 text-left text-slate-600 font-medium">材料名称</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">重量(kg)</th>
                              <th className="px-3 py-2 text-right text-slate-600 font-medium">占比(%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.materials.map((mat: any, idx: number) => (
                              <tr key={idx} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-slate-800">{mat.name}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{mat.weight}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{mat.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-500">开始时间</p>
                    <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                  </div>
                </>
              )}

              {selectedStep === 'pouring' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇包号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.ladleNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇注温度</p>
                      <p className="text-base font-bold text-red-600">{selectedRecord.pouringTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">钢水重量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.steelWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇注重量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.pouredWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">壳模数量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.shellCount} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇注数量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.pouredCount} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">合格数量</p>
                      <p className="text-base font-medium text-emerald-600">{selectedRecord.qualifiedCount} 件</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">壳模温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.shellTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇注速度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.pouringSpeed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">保温温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.holdingTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">保温时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.holdingTime} 分钟</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">浇注时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.pourTime)}</p>
                    </div>
                  </div>

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}

              {selectedStep === 'cleaning' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <p className="text-base font-medium text-slate-800">{order.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">处理类型</p>
                      <p className="text-base font-medium text-slate-800">
                        {selectedRecord.processType === 'cutting' ? '切割' :
                         selectedRecord.processType === 'grinding' ? '打磨' : '抛光'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">设备</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.equipment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">设备编号</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.equipmentNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">处理数量</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.quantity} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">合格数量</p>
                      <p className="text-base font-medium text-emerald-600">{selectedRecord.qualifiedCount} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedRecord.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">质量结果</p>
                      <p className="text-base font-bold text-emerald-600">{selectedRecord.qualityResult}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedRecord.endTime)}</p>
                    </div>
                  </div>

                  {selectedRecord.unqualifiedReason && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">不合格原因</p>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{selectedRecord.unqualifiedReason}</p>
                    </div>
                  )}

                  {selectedRecord.remark && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">备注</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.remark}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
