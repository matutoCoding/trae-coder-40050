import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection, type DynamicSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import { Link } from 'react-router-dom';
import type { DewaxingRecord, FiringRecord, CurvePoint } from '@/types';
import { Eye, Flame, ThermometerSun, Gauge, Clock, TrendingUp, Plus } from 'lucide-react';

type TabType = 'dewaxing' | 'firing';

export default function DewaxingFiring() {
  const { 
    dewaxingRecords, 
    firingRecords, 
    getWorkOrderById,
    workOrders,
    addDewaxingRecord,
    addFiringRecord
  } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('dewaxing');
  const [searchText, setSearchText] = useState('');
  const [selectedDewaxing, setSelectedDewaxing] = useState<DewaxingRecord | null>(null);
  const [selectedFiring, setSelectedFiring] = useState<FiringRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddDewaxingModal, setShowAddDewaxingModal] = useState(false);
  const [showAddFiringModal, setShowAddFiringModal] = useState(false);

  const filteredDewaxing = dewaxingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const filteredFiring = firingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const workOrderOptions = workOrders
    .filter(o => o.status === 'dewaxing' || o.status === 'firing' || o.status === 'shell_making' || o.status === 'pending')
    .map(o => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const dewaxingStats = useMemo(() => {
    const avgWaxRecovery = dewaxingRecords.length > 0
      ? (dewaxingRecords.reduce((sum, r) => sum + r.waxRecovery, 0) / dewaxingRecords.length).toFixed(1)
      : 0;
    const avgTemp = dewaxingRecords.length > 0
      ? (dewaxingRecords.reduce((sum, r) => sum + r.temperature, 0) / dewaxingRecords.length).toFixed(0)
      : 0;
    const avgDuration = dewaxingRecords.length > 0
      ? (dewaxingRecords.reduce((sum, r) => sum + r.duration, 0) / dewaxingRecords.length).toFixed(0)
      : 0;
    return [
      { label: '今日脱蜡批次', value: String(dewaxingRecords.length), unit: '批', color: 'orange' },
      { label: '平均温度', value: avgTemp, unit: '°C', color: 'blue' },
      { label: '蜡回收率', value: avgWaxRecovery, unit: '%', color: 'emerald' },
      { label: '平均时长', value: avgDuration, unit: 'min', color: 'purple' },
    ];
  }, [dewaxingRecords]);

  const firingStats = useMemo(() => {
    const avgMaxTemp = firingRecords.length > 0
      ? (firingRecords.reduce((sum, r) => sum + r.maxTemperature, 0) / firingRecords.length).toFixed(0)
      : 0;
    const avgHoldTime = firingRecords.length > 0
      ? (firingRecords.reduce((sum, r) => sum + r.holdTime, 0) / firingRecords.length).toFixed(0)
      : 0;
    const avgTotalTime = firingRecords.length > 0
      ? (firingRecords.reduce((sum, r) => sum + r.totalTime, 0) / firingRecords.length).toFixed(0)
      : 0;
    return [
      { label: '今日焙烧批次', value: String(firingRecords.length), unit: '批', color: 'red' },
      { label: '最高温度', value: avgMaxTemp, unit: '°C', color: 'orange' },
      { label: '保温时间', value: avgHoldTime, unit: 'min', color: 'amber' },
      { label: '总周期', value: avgTotalTime, unit: 'min', color: 'blue' },
    ];
  }, [firingRecords]);

  const dewaxingFormSections: FormSection[] = [
    {
      title: '基本信息',
      fields: [
        {
          name: 'workOrderId',
          label: '关联工单',
          type: 'select',
          required: true,
          options: workOrderOptions,
          placeholder: '请选择工单',
        },
        {
          name: 'kettleNo',
          label: '脱蜡釜编号',
          type: 'text',
          required: true,
          placeholder: '如：DW-01',
        },
        {
          name: 'operator',
          label: '操作工',
          type: 'text',
          required: true,
          placeholder: '请输入操作工姓名',
        },
        {
          name: 'result',
          label: '脱蜡结果',
          type: 'select',
          required: true,
          options: [
            { value: '合格', label: '合格' },
            { value: '不合格', label: '不合格' },
          ],
          defaultValue: '合格',
        },
      ],
    },
    {
      title: '工艺参数',
      fields: [
        {
          name: 'pressure',
          label: '工作压力(MPa)',
          type: 'number',
          required: true,
          placeholder: '0.6-0.8',
          step: '0.01',
          min: '0.1',
          max: '2',
          defaultValue: 0.7,
        },
        {
          name: 'temperature',
          label: '脱蜡温度(°C)',
          type: 'number',
          required: true,
          placeholder: '160-170',
          step: '1',
          min: '100',
          max: '200',
          defaultValue: 165,
        },
        {
          name: 'duration',
          label: '脱蜡时间(min)',
          type: 'number',
          required: true,
          placeholder: '20-30',
          step: '1',
          min: '5',
          max: '120',
          defaultValue: 25,
        },
        {
          name: 'waxRecovery',
          label: '蜡回收率(%)',
          type: 'number',
          required: true,
          placeholder: '≥90',
          step: '0.1',
          min: '0',
          max: '100',
          defaultValue: 92,
        },
      ],
    },
    {
      title: '时间信息',
      fields: [
        {
          name: 'startTime',
          label: '开始时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'endTime',
          label: '结束时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'remark',
          label: '备注',
          type: 'textarea',
          placeholder: '选填',
          className: 'md:col-span-2',
        },
      ],
    },
  ];

  const dewaxingValidationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'kettleNo', label: '脱蜡釜编号', required: true },
    { field: 'operator', label: '操作工', required: true },
    { field: 'result', label: '脱蜡结果', required: true },
    { field: 'pressure', label: '工作压力', required: true, type: 'number', min: 0.1, max: 2 },
    { field: 'temperature', label: '脱蜡温度', required: true, type: 'number', min: 100, max: 200 },
    { field: 'duration', label: '脱蜡时间', required: true, type: 'number', min: 5, max: 120 },
    { field: 'waxRecovery', label: '蜡回收率', required: true, type: 'number', min: 0, max: 100 },
    { field: 'startTime', label: '开始时间', required: true },
    { 
      field: 'endTime', 
      label: '结束时间', 
      required: true,
      custom: (value, allValues) => {
        if (allValues.startTime && value && String(value) < String(allValues.startTime)) {
          return '结束时间不能早于开始时间';
        }
        return null;
      }
    },
  ];

  const firingFormSections: FormSection[] = [
    {
      title: '基本信息',
      fields: [
        {
          name: 'workOrderId',
          label: '关联工单',
          type: 'select',
          required: true,
          options: workOrderOptions,
          placeholder: '请选择工单',
        },
        {
          name: 'furnaceNo',
          label: '焙烧炉编号',
          type: 'text',
          required: true,
          placeholder: '如：FR-01',
        },
        {
          name: 'operator',
          label: '操作工',
          type: 'text',
          required: true,
          placeholder: '请输入操作工姓名',
        },
      ],
    },
    {
      title: '焙烧参数',
      fields: [
        {
          name: 'maxTemperature',
          label: '最高温度(°C)',
          type: 'number',
          required: true,
          placeholder: '1000-1200',
          step: '1',
          min: '800',
          max: '1500',
          defaultValue: 1100,
        },
        {
          name: 'holdTime',
          label: '保温时间(min)',
          type: 'number',
          required: true,
          placeholder: '60-180',
          step: '1',
          min: '30',
          max: '600',
          defaultValue: 120,
        },
        {
          name: 'totalTime',
          label: '总时长(min)',
          type: 'number',
          required: true,
          placeholder: '300-600',
          step: '1',
          min: '60',
          max: '1440',
          defaultValue: 480,
        },
      ],
    },
    {
      title: '时间信息',
      fields: [
        {
          name: 'startTime',
          label: '开始时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'endTime',
          label: '结束时间',
          type: 'datetime-local',
          required: true,
          defaultValue: new Date().toISOString().slice(0, 16),
        },
        {
          name: 'remark',
          label: '备注',
          type: 'textarea',
          placeholder: '选填',
          className: 'md:col-span-2',
        },
      ],
    },
  ];

  const firingValidationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'furnaceNo', label: '焙烧炉编号', required: true },
    { field: 'operator', label: '操作工', required: true },
    { field: 'maxTemperature', label: '最高温度', required: true, type: 'number', min: 800, max: 1500 },
    { field: 'holdTime', label: '保温时间', required: true, type: 'number', min: 30, max: 600 },
    { 
      field: 'totalTime', 
      label: '总时长', 
      required: true, 
      type: 'number', 
      min: 60, 
      max: 1440,
      custom: (value, allValues) => {
        const total = Number(value);
        const hold = Number(allValues.holdTime);
        if (!isNaN(total) && !isNaN(hold) && total < hold) {
          return '总时长不能小于保温时间';
        }
        return null;
      }
    },
    { field: 'startTime', label: '开始时间', required: true },
    { 
      field: 'endTime', 
      label: '结束时间', 
      required: true,
      custom: (value, allValues) => {
        if (allValues.startTime && value && String(value) < String(allValues.startTime)) {
          return '结束时间不能早于开始时间';
        }
        return null;
      }
    },
  ];

  const curveDynamicSection: DynamicSection = {
    title: '焙烧曲线数据点',
    addButtonText: '添加曲线点',
    keyName: 'curveData',
    minItems: 3,
    filterEmpty: true,
    itemValidationRules: [
      { field: 'stage', label: '阶段描述', required: true },
      { field: 'time', label: '时间', required: true, type: 'number', min: 0 },
      { field: 'temperature', label: '温度', required: true, type: 'number', min: 0 },
    ],
    fields: [
      {
        name: 'stage',
        label: '阶段名称',
        type: 'text',
        required: true,
        placeholder: '如：升温/保温/降温',
      },
      {
        name: 'time',
        label: '时间(min)',
        type: 'number',
        required: true,
        placeholder: '0-600',
        step: '1',
        min: '0',
        max: '1440',
      },
      {
        name: 'temperature',
        label: '温度(°C)',
        type: 'number',
        required: true,
        placeholder: '25-1500',
        step: '1',
        min: '0',
        max: '1500',
      },
    ],
  };

  const handleAddDewaxing = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const newRecord: DewaxingRecord = {
      id: generateId('dw'),
      workOrderId: String(values.workOrderId),
      kettleNo: String(values.kettleNo),
      pressure: Number(values.pressure),
      temperature: Number(values.temperature),
      duration: Number(values.duration),
      waxRecovery: Number(values.waxRecovery),
      operator: String(values.operator),
      startTime: formatDT(values.startTime),
      endTime: formatDT(values.endTime),
      result: String(values.result),
      remark: values.remark ? String(values.remark) : undefined,
    };
    addDewaxingRecord(newRecord);
    setShowAddDewaxingModal(false);
  };

  const handleAddFiring = (values: Record<string, unknown>) => {
    const formatDT = (v: unknown) => {
      const s = String(v);
      return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
    };

    const curveData = (values.curveData as Record<string, unknown>[] || []).map(item => ({
      time: Number(item.time),
      temperature: Number(item.temperature),
      stage: String(item.stage || ''),
    })) as CurvePoint[] & { stage?: string }[];

    const newRecord: FiringRecord = {
      id: generateId('fr'),
      workOrderId: String(values.workOrderId),
      furnaceNo: String(values.furnaceNo),
      maxTemperature: Number(values.maxTemperature),
      holdTime: Number(values.holdTime),
      totalTime: Number(values.totalTime),
      curveData: curveData as CurvePoint[],
      operator: String(values.operator),
      startTime: formatDT(values.startTime),
      endTime: formatDT(values.endTime),
      remark: values.remark ? String(values.remark) : undefined,
    };
    addFiringRecord(newRecord);
    setShowAddFiringModal(false);
  };

  const dewaxingColumns: Column<DewaxingRecord>[] = [
    {
      key: 'workOrderId',
      title: '工单编号',
      render: (record) => {
        const order = getWorkOrderById(record.workOrderId);
        return (
          <Link to={`/work-order/${record.workOrderId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            {order?.orderNo || '-'}
          </Link>
        );
      },
    },
    {
      key: 'kettleNo',
      title: '脱蜡釜编号',
    },
    {
      key: 'pressure',
      title: '工作压力(MPa)',
      render: (record) => (
        <span className="text-sm font-medium">{record.pressure} MPa</span>
      ),
    },
    {
      key: 'temperature',
      title: '脱蜡温度(°C)',
      render: (record) => (
        <span className="text-sm">{record.temperature}°C</span>
      ),
    },
    {
      key: 'duration',
      title: '脱蜡时间(min)',
      render: (record) => (
        <span className="text-sm">{record.duration} min</span>
      ),
    },
    {
      key: 'waxRecovery',
      title: '蜡回收率(%)',
      render: (record) => (
        <span className="text-sm text-emerald-600 font-medium">{record.waxRecovery}%</span>
      ),
    },
    {
      key: 'result',
      title: '结果',
      render: (record) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          record.result === '合格' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {record.result}
        </span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'action',
      title: '操作',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDewaxing(record);
            setShowDetail(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Eye size={14} />
          详情
        </button>
      ),
    },
  ];

  const firingColumns: Column<FiringRecord>[] = [
    {
      key: 'workOrderId',
      title: '工单编号',
      render: (record) => {
        const order = getWorkOrderById(record.workOrderId);
        return (
          <Link to={`/work-order/${record.workOrderId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            {order?.orderNo || '-'}
          </Link>
        );
      },
    },
    {
      key: 'furnaceNo',
      title: '焙烧炉编号',
    },
    {
      key: 'maxTemperature',
      title: '最高温度(°C)',
      render: (record) => (
        <span className="text-sm font-medium text-red-600">{record.maxTemperature}°C</span>
      ),
    },
    {
      key: 'holdTime',
      title: '保温时间(min)',
      render: (record) => (
        <span className="text-sm">{record.holdTime} min</span>
      ),
    },
    {
      key: 'totalTime',
      title: '总时长(min)',
      render: (record) => (
        <span className="text-sm">{record.totalTime} min</span>
      ),
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'startTime',
      title: '开始时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.startTime)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFiring(record);
            setShowDetail(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Eye size={14} />
          详情
        </button>
      ),
    },
  ];

  const tabs = [
    { key: 'dewaxing' as TabType, label: '脱蜡釜压力', icon: <Gauge size={18} /> },
    { key: 'firing' as TabType, label: '型壳焙烧曲线', icon: <Flame size={18} /> },
  ];

  const statColorClasses: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const statIconClasses: Record<string, { icon: JSX.Element; bg: string }> = {
    orange: { icon: <Gauge size={20} className="text-orange-600" />, bg: 'bg-orange-50' },
    blue: { icon: <ThermometerSun size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
    emerald: { icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
    purple: { icon: <Clock size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
    red: { icon: <Flame size={20} className="text-red-600" />, bg: 'bg-red-50' },
    amber: { icon: <Clock size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
  };

  const renderCurveChart = (record: FiringRecord) => {
    if (!record.curveData || record.curveData.length === 0) return null;
    const maxTime = Math.max(...record.curveData.map(p => p.time), 1);
    const maxTemp = Math.max(...record.curveData.map(p => p.temperature), 100);
    
    return (
      <div className="relative h-56 bg-white rounded-lg p-4 border border-slate-100">
        <svg className="w-full h-full" viewBox="0 0 480 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curveGradientDetail" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 45, 90, 135, 180].map((y, i) => (
            <line
              key={i}
              x1="40"
              y1={y}
              x2="460"
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
          {record.curveData.map((point, i) => {
            const x = 40 + (point.time / maxTime) * 420;
            const y = 170 - (point.temperature / maxTemp) * 150;
            const nextPoint = record.curveData[i + 1];
            return (
              <g key={i}>
                {nextPoint && (() => {
                  const nextX = 40 + (nextPoint.time / maxTime) * 420;
                  const nextY = 170 - (nextPoint.temperature / maxTemp) * 150;
                  return (
                    <>
                      <path
                        d={`M${x},${y} L${nextX},${nextY} L${nextX},170 L${x},170 Z`}
                        fill="url(#curveGradientDetail)"
                      />
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={nextY}
                        stroke="#ef4444"
                        strokeWidth="2.5"
                      />
                    </>
                  );
                })()}
                <circle cx={x} cy={y} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
              </g>
            );
          })}
          <text x="35" y="175" fontSize="9" fill="#64748b" textAnchor="end">0°</text>
          <text x="35" y="95" fontSize="9" fill="#64748b" textAnchor="end">{Math.round(maxTemp / 2)}°</text>
          <text x="35" y="25" fontSize="9" fill="#64748b" textAnchor="end">{maxTemp}°</text>
          <text x="40" y="185" fontSize="9" fill="#64748b">0</text>
          <text x="250" y="185" fontSize="9" fill="#64748b" textAnchor="middle">时间(min)</text>
          <text x="460" y="185" fontSize="9" fill="#64748b">{maxTime}</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="脱蜡焙烧"
        description="管理脱蜡和焙烧工艺过程，监控压力温度曲线"
        addButtonText={activeTab === 'dewaxing' ? '新增脱蜡记录' : '新增焙烧记录'}
        onAdd={() => activeTab === 'dewaxing' ? setShowAddDewaxingModal(true) : setShowAddFiringModal(true)}
      />

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'dewaxing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {dewaxingStats.map((stat) => (
                  <div key={stat.label} className={`p-4 rounded-xl ${statColorClasses[stat.color]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {statIconClasses[stat.color].icon}
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {stat.value} <span className="text-sm font-normal">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddDewaxingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  新增脱蜡记录
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-orange-800 mb-4">脱蜡工艺标准</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">工作压力</p>
                    <p className="text-lg font-bold text-slate-800">0.6-0.8 MPa</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">脱蜡温度</p>
                    <p className="text-lg font-bold text-slate-800">160-170°C</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">脱蜡时间</p>
                    <p className="text-lg font-bold text-slate-800">20-30 min</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                    <p className="text-xs text-slate-500">蜡回收率</p>
                    <p className="text-lg font-bold text-emerald-600">≥90%</p>
                  </div>
                </div>
              </div>

              <div>
                <Toolbar
                  searchPlaceholder="搜索工单编号..."
                  searchValue={searchText}
                  onSearchChange={setSearchText}
                />
                <DataTable
                  columns={dewaxingColumns}
                  data={filteredDewaxing}
                  rowKey="id"
                  pagination={{
                    current: 1,
                    pageSize: 10,
                    total: filteredDewaxing.length,
                    onChange: () => {},
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'firing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {firingStats.map((stat) => (
                  <div key={stat.label} className={`p-4 rounded-xl ${statColorClasses[stat.color]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {statIconClasses[stat.color].icon}
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {stat.value} <span className="text-sm font-normal">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddFiringModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  新增焙烧记录
                </button>
              </div>

              {firingRecords.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">
                    焙烧温度曲线 - {firingRecords[firingRecords.length - 1].furnaceNo} (最新)
                  </h4>
                  {renderCurveChart(firingRecords[firingRecords.length - 1])}
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-amber-800 mb-4">焙烧工艺规范</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">升温阶段</div>
                    <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="w-40 text-xs text-amber-800 font-medium">室温 → 600°C / 2h</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">快速升温</div>
                    <div className="flex-1 h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <div className="w-40 text-xs text-orange-800 font-medium">600°C → 1100°C / 2h</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-amber-700">高温保温</div>
                    <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <div className="w-40 text-xs text-red-800 font-medium">1100°C 保温 2h</div>
                  </div>
                </div>
              </div>

              <div>
                <Toolbar
                  searchPlaceholder="搜索工单编号..."
                  searchValue={searchText}
                  onSearchChange={setSearchText}
                />
                <DataTable
                  columns={firingColumns}
                  data={filteredFiring}
                  rowKey="id"
                  pagination={{
                    current: 1,
                    pageSize: 10,
                    total: filteredFiring.length,
                    onChange: () => {},
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <FormModal
        isOpen={showAddDewaxingModal}
        title="新增脱蜡记录"
        sections={dewaxingFormSections}
        validationRules={dewaxingValidationRules}
        onClose={() => setShowAddDewaxingModal(false)}
        onSubmit={handleAddDewaxing}
        submitText="保存记录"
        size="lg"
      />

      <FormModal
        isOpen={showAddFiringModal}
        title="新增焙烧记录"
        sections={firingFormSections}
        dynamicSection={curveDynamicSection}
        validationRules={firingValidationRules}
        onClose={() => setShowAddFiringModal(false)}
        onSubmit={handleAddFiring}
        submitText="保存记录"
        size="xl"
      />

      {showDetail && (selectedDewaxing || selectedFiring) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {selectedDewaxing ? '脱蜡详情' : '焙烧详情'}
              </h3>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedDewaxing(null);
                  setSelectedFiring(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedDewaxing && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <Link to={`/work-order/${selectedDewaxing.workOrderId}`} className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {getWorkOrderById(selectedDewaxing.workOrderId)?.orderNo || '-'}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡釜</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.kettleNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">工作压力</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.pressure} MPa</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡温度</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.duration} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">蜡回收率</p>
                      <p className="text-base font-medium text-emerald-600">{selectedDewaxing.waxRecovery}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedDewaxing.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">脱蜡结果</p>
                      <p className={`text-base font-medium ${
                        selectedDewaxing.result === '合格' ? 'text-emerald-600' : 'text-red-600'
                      }`}>{selectedDewaxing.result}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedDewaxing.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedDewaxing.endTime)}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedFiring && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">工单编号</p>
                      <Link to={`/work-order/${selectedFiring.workOrderId}`} className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {getWorkOrderById(selectedFiring.workOrderId)?.orderNo || '-'}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">焙烧炉</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.furnaceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">最高温度</p>
                      <p className="text-base font-medium text-red-600">{selectedFiring.maxTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">保温时间</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.holdTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">总时长</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.totalTime} 分钟</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">操作工</p>
                      <p className="text-base font-medium text-slate-800">{selectedFiring.operator}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">开始时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedFiring.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">结束时间</p>
                      <p className="text-base font-medium text-slate-800">{formatDateTime(selectedFiring.endTime)}</p>
                    </div>
                  </div>

                  {selectedFiring.curveData && selectedFiring.curveData.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h4 className="text-sm font-semibold text-red-800 mb-4">焙烧曲线</h4>
                      {renderCurveChart(selectedFiring)}
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-red-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-red-700">序号</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-red-700">阶段</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-red-700">时间(min)</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-red-700">温度(°C)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFiring.curveData.map((point, idx) => {
                              const p = point as CurvePoint & { stage?: string };
                              return (
                                <tr key={idx} className="border-b border-red-100 last:border-0">
                                  <td className="py-2 px-3 text-red-900">#{idx + 1}</td>
                                  <td className="py-2 px-3 text-red-900">{p.stage || '-'}</td>
                                  <td className="py-2 px-3 text-red-900">{p.time}</td>
                                  <td className="py-2 px-3 text-red-900 font-medium">{p.temperature}°C</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(selectedDewaxing?.remark || selectedFiring?.remark) && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedDewaxing?.remark || selectedFiring?.remark}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedDewaxing(null);
                  setSelectedFiring(null);
                }}
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
