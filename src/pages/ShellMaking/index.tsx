import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PageHeader, { Toolbar } from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormModal, { type ValidationRule, type FormSection } from '@/components/FormModal';
import { formatDateTime, generateId } from '@/utils/format';
import type { Column } from '@/components/DataTable';
import { Link } from 'react-router-dom';
import type { ShellMakingRecord } from '@/types';
import { Plus, Eye, Layers, Droplets, Clock, Thermometer, Droplet } from 'lucide-react';

type TabType = 'layers' | 'viscosity' | 'drying';

export default function ShellMaking() {
  const {
    shellMakingRecords,
    workOrders,
    assemblyRecords,
    getWorkOrderById,
    getAssemblyByOrderId,
    addShellMakingRecord,
  } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('layers');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ShellMakingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddLayers, setShowAddLayers] = useState(false);
  const [showAddViscosity, setShowAddViscosity] = useState(false);
  const [showAddDrying, setShowAddDrying] = useState(false);

  const filteredRecords = shellMakingRecords.filter((r) => {
    const order = getWorkOrderById(r.workOrderId);
    return order?.orderNo.toLowerCase().includes(searchText.toLowerCase());
  });

  const viscosityData = useMemo(() => {
    return shellMakingRecords
      .slice()
      .sort((a, b) => a.operateTime.localeCompare(b.operateTime))
      .slice(-6)
      .map((r) => {
        const layerMap: Record<number, string> = {
          1: '面层',
          2: '过渡层',
          3: '过渡层',
        };
        return {
          time: r.operateTime.slice(11, 16),
          viscosity: r.viscosity,
          layer: layerMap[r.layerNumber] || `背层${r.layerNumber - 3}`,
        };
      });
  }, [shellMakingRecords]);

  const dryingRecords = useMemo(() => {
    return shellMakingRecords.map((r, idx) => {
      const assembly = assemblyRecords.find((a) => a.id === r.assemblyId);
      const start = new Date(r.operateTime).getTime();
      const now = Date.now();
      const elapsedHours = (now - start) / (1000 * 60 * 60);
      const isCompleted = elapsedHours >= r.dryTime;
      const progress = Math.min((elapsedHours / r.dryTime) * 100, 100);
      return {
        id: idx + 1,
        assemblyNo: assembly?.assemblyNo || `ASM-${String(idx + 1).padStart(3, '0')}`,
        layer: r.layerNumber,
        startTime: r.operateTime,
        duration: r.dryTime,
        temperature: r.dryTemperature,
        humidity: r.dryHumidity,
        status: isCompleted ? 'completed' : 'drying',
        progress: isCompleted ? 100 : Math.round(progress),
      };
    });
  }, [shellMakingRecords, assemblyRecords]);

  const stats = useMemo(() => {
    const totalLayers = shellMakingRecords.length;
    const avgViscosity =
      shellMakingRecords.length > 0
        ? (
            shellMakingRecords.reduce((sum, r) => sum + r.viscosity, 0) /
            shellMakingRecords.length
          ).toFixed(1)
        : '0';
    const avgDryTime =
      shellMakingRecords.length > 0
        ? (
            shellMakingRecords.reduce((sum, r) => sum + r.dryTime, 0) /
            shellMakingRecords.length
          ).toFixed(1)
        : '0';
    const avgTemp =
      shellMakingRecords.length > 0
        ? (
            shellMakingRecords.reduce((sum, r) => sum + r.dryTemperature, 0) /
            shellMakingRecords.length
          ).toFixed(1)
        : '0';
    return { totalLayers, avgViscosity, avgDryTime, avgTemp };
  }, [shellMakingRecords]);

  const viscosityStats = useMemo(() => {
    const layer1 = shellMakingRecords.filter((r) => r.layerNumber === 1);
    const layer23 = shellMakingRecords.filter((r) => r.layerNumber === 2 || r.layerNumber === 3);
    const layerBack = shellMakingRecords.filter((r) => r.layerNumber >= 4);
    const avg = (arr: ShellMakingRecord[]) =>
      arr.length > 0 ? (arr.reduce((s, r) => s + r.viscosity, 0) / arr.length).toFixed(1) : '0';
    return {
      face: avg(layer1),
      transition: avg(layer23),
      back: avg(layerBack),
    };
  }, [shellMakingRecords]);

  const workOrderOptions = workOrders
    .filter((o) => o.status === 'shell_making' || o.status === 'assembly' || o.status === 'pending')
    .map((o) => ({ value: o.id, label: `${o.orderNo} - ${o.productName}` }));

  const getAssemblyOptions = (workOrderId: string) => {
    return getAssemblyByOrderId(workOrderId).map((a) => ({
      value: a.id,
      label: a.assemblyNo,
    }));
  };

  const baseSection = (tab: TabType): FormSection => ({
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
        name: 'assemblyId',
        label: '模组编号',
        type: 'select',
        required: true,
        dependsOn: 'workOrderId',
        getOptions: (values) =>
          values.workOrderId
            ? getAssemblyByOrderId(String(values.workOrderId)).map((a) => ({
                value: a.id,
                label: a.assemblyNo,
              }))
            : [],
        placeholder: '请先选择工单',
      },
      {
        name: 'layerNumber',
        label: '制壳层数',
        type: 'number',
        required: true,
        placeholder: '1-9层',
        step: '1',
        min: '1',
        max: '9',
        defaultValue: 1,
      },
      {
        name: 'operator',
        label: '操作工',
        type: 'text',
        required: true,
        placeholder: '请输入操作工姓名',
      },
      {
        name: 'operateTime',
        label: '操作时间',
        type: 'datetime-local',
        required: true,
        defaultValue: new Date().toISOString().slice(0, 16),
        className: tab === 'layers' ? 'md:col-span-2' : '',
      },
    ],
  });

  const layersFormSections: FormSection[] = [
    baseSection('layers'),
    {
      title: '层数与砂料信息',
      fields: [
        {
          name: 'slurryType',
          label: '涂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英粉涂料', label: '锆英粉涂料（面层）' },
            { value: '莫来石涂料', label: '莫来石涂料（过渡层）' },
            { value: '石英粉涂料', label: '石英粉涂料（背层）' },
          ],
          defaultValue: '锆英粉涂料',
        },
        {
          name: 'viscosity',
          label: '涂料粘度(s)',
          type: 'number',
          required: true,
          placeholder: '20-40s',
          step: '0.1',
          min: '10',
          max: '60',
          defaultValue: 35,
        },
        {
          name: 'sandType',
          label: '砂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英砂', label: '锆英砂' },
            { value: '莫来砂', label: '莫来砂' },
            { value: '石英砂', label: '石英砂' },
          ],
          defaultValue: '锆英砂',
        },
        {
          name: 'sandMesh',
          label: '砂料目数',
          type: 'select',
          required: true,
          options: [
            { value: '100目', label: '100目（面层）' },
            { value: '60目', label: '60目（过渡层）' },
            { value: '30目', label: '30目（背层）' },
            { value: '16目', label: '16目（加固层）' },
          ],
          defaultValue: '100目',
        },
      ],
    },
    {
      title: '干燥参数',
      fields: [
        {
          name: 'dryTime',
          label: '干燥时长(h)',
          type: 'number',
          required: true,
          placeholder: '4-48h',
          step: '1',
          min: '2',
          max: '72',
          defaultValue: 24,
        },
        {
          name: 'dryTemperature',
          label: '干燥温度(°C)',
          type: 'number',
          required: true,
          placeholder: '18-28°C',
          step: '0.1',
          min: '10',
          max: '40',
          defaultValue: 24,
        },
        {
          name: 'dryHumidity',
          label: '环境湿度(%)',
          type: 'number',
          required: true,
          placeholder: '40-70%',
          step: '1',
          min: '20',
          max: '90',
          defaultValue: 55,
        },
      ],
    },
  ];

  const viscosityFormSections: FormSection[] = [
    baseSection('viscosity'),
    {
      title: '涂料粘度参数',
      fields: [
        {
          name: 'slurryType',
          label: '涂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英粉涂料', label: '锆英粉涂料（面层）' },
            { value: '莫来石涂料', label: '莫来石涂料（过渡层）' },
            { value: '石英粉涂料', label: '石英粉涂料（背层）' },
          ],
          defaultValue: '锆英粉涂料',
        },
        {
          name: 'viscosity',
          label: '涂料粘度(s)',
          type: 'number',
          required: true,
          placeholder: '面层32-38s，过渡层25-30s，背层20-25s',
          step: '0.1',
          min: '10',
          max: '60',
          defaultValue: 35,
        },
        {
          name: 'sandType',
          label: '砂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英砂', label: '锆英砂' },
            { value: '莫来砂', label: '莫来砂' },
            { value: '石英砂', label: '石英砂' },
          ],
          defaultValue: '锆英砂',
        },
        {
          name: 'sandMesh',
          label: '砂料目数',
          type: 'select',
          required: true,
          options: [
            { value: '100目', label: '100目（面层）' },
            { value: '60目', label: '60目（过渡层）' },
            { value: '30目', label: '30目（背层）' },
            { value: '16目', label: '16目（加固层）' },
          ],
          defaultValue: '100目',
        },
        {
          name: 'dryTime',
          label: '干燥时长(h)',
          type: 'number',
          required: true,
          placeholder: '4-48h',
          step: '1',
          min: '2',
          max: '72',
          defaultValue: 24,
        },
        {
          name: 'dryTemperature',
          label: '干燥温度(°C)',
          type: 'number',
          required: true,
          placeholder: '18-28°C',
          step: '0.1',
          min: '10',
          max: '40',
          defaultValue: 24,
        },
        {
          name: 'dryHumidity',
          label: '环境湿度(%)',
          type: 'number',
          required: true,
          placeholder: '40-70%',
          step: '1',
          min: '20',
          max: '90',
          defaultValue: 55,
        },
      ],
    },
  ];

  const dryingFormSections: FormSection[] = [
    baseSection('drying'),
    {
      title: '干燥环境参数',
      fields: [
        {
          name: 'dryTime',
          label: '干燥时长(h)',
          type: 'number',
          required: true,
          placeholder: '面层4-8h，背层12-24h',
          step: '1',
          min: '2',
          max: '72',
          defaultValue: 24,
        },
        {
          name: 'dryTemperature',
          label: '干燥温度(°C)',
          type: 'number',
          required: true,
          placeholder: '18-28°C',
          step: '0.1',
          min: '10',
          max: '40',
          defaultValue: 24,
        },
        {
          name: 'dryHumidity',
          label: '环境湿度(%)',
          type: 'number',
          required: true,
          placeholder: '面层50-70%，背层40-60%',
          step: '1',
          min: '20',
          max: '90',
          defaultValue: 55,
        },
        {
          name: 'viscosity',
          label: '涂料粘度(s)',
          type: 'number',
          required: true,
          placeholder: '20-40s',
          step: '0.1',
          min: '10',
          max: '60',
          defaultValue: 30,
        },
      ],
    },
    {
      title: '涂料与砂料',
      fields: [
        {
          name: 'slurryType',
          label: '涂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英粉涂料', label: '锆英粉涂料（面层）' },
            { value: '莫来石涂料', label: '莫来石涂料（过渡层）' },
            { value: '石英粉涂料', label: '石英粉涂料（背层）' },
          ],
          defaultValue: '莫来石涂料',
        },
        {
          name: 'sandType',
          label: '砂料类型',
          type: 'select',
          required: true,
          options: [
            { value: '锆英砂', label: '锆英砂' },
            { value: '莫来砂', label: '莫来砂' },
            { value: '石英砂', label: '石英砂' },
          ],
          defaultValue: '莫来砂',
        },
        {
          name: 'sandMesh',
          label: '砂料目数',
          type: 'select',
          required: true,
          options: [
            { value: '100目', label: '100目（面层）' },
            { value: '60目', label: '60目（过渡层）' },
            { value: '30目', label: '30目（背层）' },
            { value: '16目', label: '16目（加固层）' },
          ],
          defaultValue: '60目',
        },
      ],
    },
  ];

  const baseValidationRules: ValidationRule[] = [
    { field: 'workOrderId', label: '关联工单', required: true },
    { field: 'assemblyId', label: '模组编号', required: true },
    { field: 'layerNumber', label: '制壳层数', required: true, type: 'number', min: 1, max: 9 },
    { field: 'operator', label: '操作工', required: true },
    { field: 'operateTime', label: '操作时间', required: true },
  ];

  const layersValidationRules: ValidationRule[] = [
    ...baseValidationRules,
    { field: 'slurryType', label: '涂料类型', required: true },
    { field: 'viscosity', label: '涂料粘度', required: true, type: 'number', min: 10, max: 60 },
    { field: 'sandType', label: '砂料类型', required: true },
    { field: 'sandMesh', label: '砂料目数', required: true },
    { field: 'dryTime', label: '干燥时长', required: true, type: 'number', min: 2, max: 72 },
    { field: 'dryTemperature', label: '干燥温度', required: true, type: 'number', min: 10, max: 40 },
    { field: 'dryHumidity', label: '环境湿度', required: true, type: 'number', min: 20, max: 90 },
  ];

  const viscosityValidationRules: ValidationRule[] = [
    ...baseValidationRules,
    { field: 'slurryType', label: '涂料类型', required: true },
    {
      field: 'viscosity',
      label: '涂料粘度',
      required: true,
      type: 'number',
      min: 10,
      max: 60,
      custom: (value, allValues) => {
        const layer = Number(allValues.layerNumber);
        const v = Number(value);
        if (layer === 1 && (v < 32 || v > 38)) {
          return '面层涂料粘度标准范围为32-38s';
        }
        if ((layer === 2 || layer === 3) && (v < 25 || v > 30)) {
          return '过渡层涂料粘度标准范围为25-30s';
        }
        if (layer >= 4 && (v < 20 || v > 25)) {
          return '背层涂料粘度标准范围为20-25s';
        }
        return null;
      },
    },
    { field: 'sandType', label: '砂料类型', required: true },
    { field: 'sandMesh', label: '砂料目数', required: true },
    { field: 'dryTime', label: '干燥时长', required: true, type: 'number', min: 2, max: 72 },
    { field: 'dryTemperature', label: '干燥温度', required: true, type: 'number', min: 10, max: 40 },
    { field: 'dryHumidity', label: '环境湿度', required: true, type: 'number', min: 20, max: 90 },
  ];

  const dryingValidationRules: ValidationRule[] = [
    ...baseValidationRules,
    {
      field: 'dryTime',
      label: '干燥时长',
      required: true,
      type: 'number',
      min: 2,
      max: 72,
      custom: (value, allValues) => {
        const layer = Number(allValues.layerNumber);
        const t = Number(value);
        if ((layer === 1 || layer === 2) && t < 4) {
          return '面层/过渡层干燥时长不少于4小时';
        }
        if (layer >= 3 && t < 8) {
          return '背层干燥时长不少于8小时';
        }
        return null;
      },
    },
    { field: 'dryTemperature', label: '干燥温度', required: true, type: 'number', min: 10, max: 40 },
    {
      field: 'dryHumidity',
      label: '环境湿度',
      required: true,
      type: 'number',
      min: 20,
      max: 90,
      custom: (value, allValues) => {
        const layer = Number(allValues.layerNumber);
        const h = Number(value);
        if ((layer === 1 || layer === 2) && (h < 50 || h > 70)) {
          return '面层/过渡层环境湿度标准范围为50-70%';
        }
        if (layer >= 3 && (h < 40 || h > 60)) {
          return '背层环境湿度标准范围为40-60%';
        }
        return null;
      },
    },
    { field: 'viscosity', label: '涂料粘度', required: true, type: 'number', min: 10, max: 60 },
    { field: 'slurryType', label: '涂料类型', required: true },
    { field: 'sandType', label: '砂料类型', required: true },
    { field: 'sandMesh', label: '砂料目数', required: true },
  ];

  const formatDT = (v: unknown) => {
    const s = String(v);
    return s.includes('T') ? s.replace('T', ' ') + ':00' : s;
  };

  const buildRecord = (values: Record<string, unknown>): ShellMakingRecord => ({
    id: generateId('sm'),
    workOrderId: String(values.workOrderId),
    assemblyId: String(values.assemblyId),
    layerNumber: Number(values.layerNumber),
    slurryType: String(values.slurryType),
    viscosity: Number(values.viscosity),
    sandType: String(values.sandType),
    sandMesh: String(values.sandMesh),
    dryTime: Number(values.dryTime),
    dryTemperature: Number(values.dryTemperature),
    dryHumidity: Number(values.dryHumidity),
    operator: String(values.operator),
    operateTime: formatDT(values.operateTime),
  });

  const handleSubmitLayers = (values: Record<string, unknown>) => {
    addShellMakingRecord(buildRecord(values));
    setShowAddLayers(false);
  };

  const handleSubmitViscosity = (values: Record<string, unknown>) => {
    addShellMakingRecord(buildRecord(values));
    setShowAddViscosity(false);
  };

  const handleSubmitDrying = (values: Record<string, unknown>) => {
    addShellMakingRecord(buildRecord(values));
    setShowAddDrying(false);
  };

  const columns: Column<ShellMakingRecord>[] = [
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
      key: 'layerNumber',
      title: '层数',
      render: (record) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {record.layerNumber}
        </span>
      ),
    },
    {
      key: 'slurryType',
      title: '涂料类型',
    },
    {
      key: 'viscosity',
      title: '涂料粘度(s)',
      render: (record) => (
        <span
          className={`text-sm font-medium ${
            record.viscosity > 30 && record.layerNumber === 1
              ? 'text-amber-600'
              : 'text-slate-700'
          }`}
        >
          {record.viscosity} s
        </span>
      ),
    },
    {
      key: 'sandType',
      title: '砂料类型',
    },
    {
      key: 'sandMesh',
      title: '砂料目数',
    },
    {
      key: 'dryTime',
      title: '干燥时间(h)',
      render: (record) => <span className="text-sm">{record.dryTime} h</span>,
    },
    {
      key: 'operator',
      title: '操作工',
    },
    {
      key: 'operateTime',
      title: '操作时间',
      render: (record) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.operateTime)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(record);
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
    { key: 'layers' as TabType, label: '制壳层数管控', icon: <Layers size={18} /> },
    { key: 'viscosity' as TabType, label: '涂料粘度监控', icon: <Droplets size={18} /> },
    { key: 'drying' as TabType, label: '型壳干燥时长', icon: <Clock size={18} /> },
  ];

  const addButtonConfigs: Record<TabType, { text: string; onClick: () => void }> = {
    layers: { text: '新增层数记录', onClick: () => setShowAddLayers(true) },
    viscosity: { text: '新增粘度记录', onClick: () => setShowAddViscosity(true) },
    drying: { text: '新增干燥记录', onClick: () => setShowAddDrying(true) },
  };

  const addBtn = addButtonConfigs[activeTab];

  return (
    <div className="space-y-6">
      <PageHeader
        title="制壳挂砂"
        description="管理制壳挂砂全过程，包括层数管控、粘度监控和干燥管理"
        showAddButton={false}
        extraActions={
          <button
            onClick={addBtn.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            {addBtn.text}
          </button>
        }
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
          {activeTab === 'layers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">总层数记录</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalLayers} 层</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={20} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">平均粘度</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{stats.avgViscosity} s</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">平均干燥</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{stats.avgDryTime} h</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">干燥温度</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{stats.avgTemp}°C</p>
                </div>
              </div>

              <div>
                <Toolbar
                  searchPlaceholder="搜索工单编号..."
                  searchValue={searchText}
                  onSearchChange={setSearchText}
                />
                <DataTable
                  columns={columns}
                  data={filteredRecords}
                  rowKey="id"
                  pagination={{
                    current: 1,
                    pageSize: 10,
                    total: filteredRecords.length,
                    onChange: () => {},
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'viscosity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">面层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">{viscosityStats.face} s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 32-38s</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">过渡层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">{viscosityStats.transition} s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 25-30s</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">背层涂料粘度</p>
                  <p className="text-3xl font-bold mt-2">{viscosityStats.back} s</p>
                  <p className="text-xs opacity-75 mt-1">标准范围: 20-25s</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-700">粘度监测记录</h4>
                </div>
                <div className="space-y-2">
                  {viscosityData.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-8">
                      暂无粘度记录，点击右上角「新增粘度记录」开始添加
                    </div>
                  ) : (
                    viscosityData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-white rounded-lg"
                      >
                        <span className="text-sm text-slate-500 w-20">{item.time}</span>
                        <span className="text-sm text-slate-600 w-20">{item.layer}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(item.viscosity / 40) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-800 w-16 text-right">
                          {item.viscosity} s
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">涂料配比（面层）</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>硅溶胶</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>锆英粉</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>润湿剂</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消泡剂</span>
                      <span className="font-medium">2%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-3">涂料配比（背层）</h4>
                  <div className="space-y-2 text-sm text-emerald-700">
                    <div className="flex justify-between">
                      <span>硅溶胶</span>
                      <span className="font-medium">55%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>莫来石粉</span>
                      <span className="font-medium">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>润湿剂</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>消泡剂</span>
                      <span className="font-medium">2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drying' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600">干燥中模组</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {dryingRecords.filter((r) => r.status === 'drying').length} 组
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600">已完成干燥</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {dryingRecords.filter((r) => r.status === 'completed').length} 组
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600">干燥室温度</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stats.avgTemp}°C</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600">干燥室湿度</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {shellMakingRecords.length > 0
                      ? (
                          shellMakingRecords.reduce((s, r) => s + r.dryHumidity, 0) /
                          shellMakingRecords.length
                        ).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-700">干燥进度表</h4>
                </div>
                <table className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                        模组编号
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        当前层数
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        开始时间
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        干燥时长
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        温度
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        湿度
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        状态
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        进度
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dryingRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-slate-400 text-sm"
                        >
                          暂无干燥记录，点击右上角「新增干燥记录」开始添加
                        </td>
                      </tr>
                    ) : (
                      dryingRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {record.assemblyNo}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">第 {record.layer} 层</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-500">
                            {formatDateTime(record.startTime)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">{record.duration} h</td>
                          <td className="px-4 py-3 text-center text-sm">
                            {record.temperature}°C
                          </td>
                          <td className="px-4 py-3 text-center text-sm">{record.humidity}%</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === 'drying'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {record.status === 'drying' ? '干燥中' : '已完成'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  record.status === 'drying' ? 'bg-blue-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${record.progress}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <FormModal
        isOpen={showAddLayers}
        title="新增制壳层数记录"
        sections={layersFormSections}
        validationRules={layersValidationRules}
        onClose={() => setShowAddLayers(false)}
        onSubmit={handleSubmitLayers}
        submitText="保存层数记录"
        size="lg"
      />

      <FormModal
        isOpen={showAddViscosity}
        title="新增涂料粘度记录"
        sections={viscosityFormSections}
        validationRules={viscosityValidationRules}
        onClose={() => setShowAddViscosity(false)}
        onSubmit={handleSubmitViscosity}
        submitText="保存粘度记录"
        size="lg"
      />

      <FormModal
        isOpen={showAddDrying}
        title="新增型壳干燥记录"
        sections={dryingFormSections}
        validationRules={dryingValidationRules}
        onClose={() => setShowAddDrying(false)}
        onSubmit={handleSubmitDrying}
        submitText="保存干燥记录"
        size="lg"
      />

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">制壳详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单编号</p>
                  <Link to={`/work-order/${selectedRecord.workOrderId}`} className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    {getWorkOrderById(selectedRecord.workOrderId)?.orderNo || '-'}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-slate-500">模组编号</p>
                  <p className="text-base font-medium text-slate-800">
                    {assemblyRecords.find((a) => a.id === selectedRecord.assemblyId)?.assemblyNo || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">层数</p>
                  <p className="text-base font-medium text-slate-800">
                    第 {selectedRecord.layerNumber} 层
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">涂料类型</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.slurryType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">涂料粘度</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.viscosity} s
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">砂料类型</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.sandType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">砂料目数</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.sandMesh}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">干燥时间</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.dryTime} 小时
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">操作工</p>
                  <p className="text-base font-medium text-slate-800">
                    {selectedRecord.operator}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">干燥环境</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedRecord.dryTemperature}°C
                    </p>
                    <p className="text-xs text-slate-500 mt-1">干燥温度</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedRecord.dryHumidity}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">环境湿度</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">操作时间</p>
                <p className="text-base font-medium text-slate-800">
                  {formatDateTime(selectedRecord.operateTime)}
                </p>
              </div>
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
